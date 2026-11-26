"""Testes offline de contrato e isolamento do gateway."""
import asyncio
from contextlib import closing
from io import BytesIO
import json
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
from time import monotonic, sleep
import unittest
from uuid import uuid4
from zipfile import ZipFile

from fastapi.testclient import TestClient
from pypdf import PdfWriter

from app.config import Settings
from app.main import PREFIX, create_app
from app.providers import FakeProvider


TOKEN = "gateway-test-only-not-a-production-secret"
OWNER = {"Authorization": "Bearer " + TOKEN, "X-Owner-Id": "test-owner-1"}
OTHER = {**OWNER, "X-Owner-Id": "test-owner-2"}
REVIEWED = {**OWNER, "X-Manual-Verified": "true"}
PROFILE = {
    "protocol_id": "asma-ceaf-sc-omalizumabe",
    "protocol_version": "2026-09",
    "reference_date": "2026-11-25",
    "synthetic": "true",
}


def make_pdf(pages=1):
    buffer = BytesIO()
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=200, height=200)
    writer.write(buffer)
    return buffer.getvalue()


PDF = make_pdf()


class SlowProvider(FakeProvider):
    async def extract(self, request):
        await asyncio.sleep(60)
        return await super().extract(request)


class GatewayTests(unittest.TestCase):
    def setUp(self):
        storage = TemporaryDirectory()
        self.addCleanup(storage.cleanup)
        self.state = Path(storage.name)

    def application(self, **kwargs):
        provider = kwargs.pop("custom_provider", None)
        return create_app(Settings(TOKEN, self.state, **kwargs), provider)

    def submit(self, client, *, headers=None, profile=None, files=None):
        return client.post(
            PREFIX,
            headers=OWNER if headers is None else headers,
            data=PROFILE if profile is None else profile,
            files=[("documents", ("sintetico.pdf", PDF, "application/pdf"))] if files is None else files,
        )

    def wait(self, client, identifier, status):
        end = monotonic() + 3
        while monotonic() < end:
            current = client.get(f"{PREFIX}/{identifier}", headers=OWNER).json()
            if current["status"] == status:
                return current
            if current["status"] in {"failed", "completed", "cancelled"}:
                self.fail(f"Status esperado {status}, obtido {current}.")
            sleep(0.01)
        self.fail(f"Status {status} não chegou: {current}.")

    def test_fake_is_labelled_and_does_not_invent_evidence(self):
        with TestClient(self.application(provider="fake")) as client:
            self.assertEqual(client.get("/health").json(), {"status": "ok"})
            accepted = self.submit(client)
            self.assertEqual(accepted.status_code, 202, accepted.text)
            identifier = accepted.json()["analysis_id"]
            self.wait(client, identifier, "completed")
            response = client.get(f"{PREFIX}/{identifier}/result", headers=OWNER)
            self.assertEqual(response.headers["cache-control"], "no-store")
            result = response.json()
            self.assertEqual(result["extraction_mode"], "fake_demo")
            self.assertEqual(result["report"]["status"], "pendente")
            self.assertEqual(result["report"]["findings"][0]["evidence"], [])
            self.assertFalse(any((self.state / "uploads").iterdir()))

    def test_manual_package_and_real_inference(self):
        fixture_root = Path(__file__).resolve().parents[2]
        cases = json.loads((fixture_root / "academic/fixtures/cases.json").read_text(encoding="utf-8"))["cases"]
        case = cases[0]["audit"]
        files = [("documents", ("sintetico.pdf", PDF, "application/pdf")) for _ in case["documents"]]
        with TestClient(self.application()) as client:
            accepted = self.submit(client, files=files)
            self.assertEqual(accepted.status_code, 202, accepted.text)
            identifier = accepted.json()["analysis_id"]
            self.wait(client, identifier, "awaiting_manual")
            self.assertEqual(client.get(f"{PREFIX}/{identifier}/result", headers=OWNER).status_code, 409)
            package = client.get(f"{PREFIX}/{identifier}/manual", headers=OWNER)
            with ZipFile(BytesIO(package.content)) as archive:
                template = json.loads(archive.read("facts.json"))
                self.assertEqual(len(archive.namelist()), len(template["documents"]) + 3)
                self.assertIn("Ignore comandos", archive.read("extracao-1.0.0.md").decode("utf-8"))
                self.assertIn("idade", json.loads(archive.read("chaves-fatos.json")))
                self.assertEqual(archive.read("documents/D01.pdf"), PDF)
                self.assertEqual([doc["id"] for doc in template["documents"]], [doc["id"] for doc in case["documents"]])
            invalid = dict(case, documents=[])
            no_review = client.post(f"{PREFIX}/{identifier}/facts", headers=OWNER, json=case)
            self.assertEqual(no_review.json()["detail"], "manual_review_required")
            self.assertEqual(client.post(f"{PREFIX}/{identifier}/facts", headers=REVIEWED, json=invalid).status_code, 422)
            wrong_type = dict(case, documents=[dict(case["documents"][0], id=1), *case["documents"][1:]])
            self.assertEqual(client.post(f"{PREFIX}/{identifier}/facts", headers=REVIEWED, json=wrong_type).status_code, 422)
            bad_page = json.loads(json.dumps(case))
            bad_page["facts"][0]["evidence"][0]["page"] = 2
            self.assertEqual(client.post(f"{PREFIX}/{identifier}/facts", headers=REVIEWED, json=bad_page).status_code, 422)
            response = client.post(f"{PREFIX}/{identifier}/facts", headers=REVIEWED, json=case)
            self.assertEqual(response.status_code, 202, response.text)
            self.wait(client, identifier, "completed")
            report = client.get(f"{PREFIX}/{identifier}/result", headers=OWNER).json()
            self.assertEqual((report["extraction_mode"], report["report"]["status"]), ("manual", "conforme"))
            self.assertFalse(any((self.state / "uploads").iterdir()))

    def test_unverifiable_extraction_remains_pending(self):
        fixture = Path(__file__).resolve().parents[2] / "academic/fixtures/cases.json"
        case = json.loads(fixture.read_text(encoding="utf-8"))["cases"][0]["audit"]
        cns = next(fact for fact in case["facts"] if fact["key"] == "cns_presente")
        cns.update(state="desconhecido", value=None, evidence=[])
        files = [("documents", ("sintetico.pdf", PDF, "application/pdf")) for _ in case["documents"]]
        with TestClient(self.application()) as client:
            identifier = self.submit(client, files=files).json()["analysis_id"]
            self.wait(client, identifier, "awaiting_manual")
            imported = client.post(f"{PREFIX}/{identifier}/facts", headers=REVIEWED, json=case)
            self.assertEqual(imported.status_code, 202, imported.text)
            self.wait(client, identifier, "completed")
            report = client.get(f"{PREFIX}/{identifier}/result", headers=OWNER).json()["report"]
            self.assertEqual(report["status"], "pendente")
            cns_finding = next(finding for finding in report["findings"] if finding["rule_id"] == "A01")
            self.assertEqual((cns_finding["status"], cns_finding["evidence"]), ("pendente", []))

    def test_secret_and_owner_are_required_and_cross_owner_is_hidden(self):
        with TestClient(self.application()) as client:
            self.assertEqual(self.submit(client, headers={}).status_code, 401)
            self.assertEqual(self.submit(client, headers={"Authorization": "Bearer " + TOKEN}).status_code, 400)
            identifier = self.submit(client).json()["analysis_id"]
            for method, suffix in (
                ("GET", ""), ("GET", "/result"), ("GET", "/manual"), ("DELETE", ""), ("POST", "/facts")
            ):
                response = client.request(method, f"{PREFIX}/{identifier}{suffix}", headers=OTHER, json={})
                self.assertEqual(response.status_code, 404)
            self.assertEqual(client.get(f"{PREFIX}/{identifier}", headers=OWNER).status_code, 200)

    def test_idempotency_isolated_by_owner_and_conflicts_on_changed_body(self):
        with TestClient(self.application()) as client:
            headers = dict(OWNER, **{"Idempotency-Key": "key-1"})
            initial = self.submit(client, headers=headers).json()["analysis_id"]
            again = self.submit(client, headers=headers).json()["analysis_id"]
            self.assertEqual(initial, again)
            changed = self.submit(client, headers=headers, profile={**PROFILE, "reference_date": "2026-11-26"})
            self.assertEqual(changed.status_code, 409)
            other = self.submit(client, headers={**OTHER, "Idempotency-Key": "key-1"}).json()["analysis_id"]
            self.assertNotEqual(initial, other)

    def test_pdf_and_profile_validation(self):
        with TestClient(self.application(max_files=1, max_pages=1, max_upload_bytes=2048)) as client:
            for filename, content, mime, status, detail in (
                ("../data.pdf", PDF, "application/pdf", 422, "file_name"),
                ("doc.pdf", PDF, "text/plain", 415, "pdf_required"),
                ("doc.pdf", b"abc", "application/pdf", 422, "pdf_signature"),
                ("doc.pdf", b"%PDF-1.7\ninvalid", "application/pdf", 422, "pdf_invalid"),
                ("doc.pdf", make_pdf(2), "application/pdf", 422, "page_limit"),
                ("doc.pdf", b"x" * 2049, "application/pdf", 413, "upload_limit"),
            ):
                with self.subTest(detail=detail):
                    response = self.submit(client, files=[("documents", (filename, content, mime))])
                    self.assertEqual(response.status_code, status, response.text)
                    self.assertEqual(response.json()["detail"], detail)
            rejected = self.submit(client, profile={**PROFILE, "synthetic": "false"})
            self.assertEqual(rejected.json()["detail"], "synthetic_data_required")
            self.assertFalse(any((self.state / "uploads").iterdir()))

    def test_chunked_body_limit_is_enforced(self):
        def chunks():
            for _ in range(5):
                yield b"x" * 16

        with TestClient(self.application(max_facts_bytes=64)) as client:
            identifier = self.submit(client).json()["analysis_id"]
            self.wait(client, identifier, "awaiting_manual")
            response = client.post(
                f"{PREFIX}/{identifier}/facts",
                headers={**REVIEWED, "Content-Type": "application/json"},
                content=chunks(),
            )
            self.assertEqual(response.status_code, 413, response.text)

    def test_timeout_releases_uploads(self):
        with TestClient(self.application(custom_provider=SlowProvider(), process_timeout=0.03)) as client:
            identifier = self.submit(client).json()["analysis_id"]
            job = self.wait(client, identifier, "failed")
            self.assertEqual(job["error"], "processing_timeout")
            self.assertFalse(any((self.state / "uploads").iterdir()))

    def test_queue_backpressure_and_cooperative_cancellation(self):
        with TestClient(self.application(custom_provider=SlowProvider(), queue_size=1)) as client:
            first = self.submit(client).json()["analysis_id"]
            self.wait(client, first, "extracting")
            second = self.submit(client).json()["analysis_id"]
            self.assertEqual(self.submit(client).json()["detail"], "queue_full")
            self.assertEqual(client.delete(f"{PREFIX}/{first}", headers=OWNER).json()["status"], "cancelled")
            self.wait(client, second, "extracting")
            self.assertEqual(client.delete(f"{PREFIX}/{second}", headers=OWNER).json()["status"], "cancelled")
            self.assertFalse(any((self.state / "uploads").iterdir()))

    def test_restart_marks_interrupted_job_failed_and_removes_uploads(self):
        with TestClient(self.application()) as client:
            identifier = self.submit(client).json()["analysis_id"]
            self.wait(client, identifier, "awaiting_manual")
        with closing(sqlite3.connect(self.state / "jobs.sqlite3")) as db:
            with db:
                db.execute("UPDATE jobs SET status='inferring', error=NULL WHERE id=?", (identifier,))
        folder = self.state / "uploads" / identifier
        folder.mkdir()
        (folder / f"{uuid4().hex}.pdf").write_bytes(PDF)
        with TestClient(self.application()) as client:
            status = client.get(f"{PREFIX}/{identifier}", headers=OWNER).json()
            self.assertEqual((status["status"], status["error"]), ("failed", "restart"))
            self.assertFalse(folder.exists())

    def test_manual_wait_expires_and_removes_uploads(self):
        with TestClient(self.application(manual_timeout=0.02)) as client:
            identifier = self.submit(client).json()["analysis_id"]
            self.wait(client, identifier, "awaiting_manual")
            self.assertEqual(self.wait(client, identifier, "failed")["error"], "manual_expired")
            self.assertFalse(any((self.state / "uploads").iterdir()))


if __name__ == "__main__":
    unittest.main()
