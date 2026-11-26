"""Fila, estados e armazenamento efêmero dos documentos."""
import asyncio
from contextlib import suppress
from dataclasses import dataclass, field
import hashlib
from io import BytesIO
import json
from pathlib import Path
import shutil
import sqlite3
from uuid import UUID, uuid4
from zipfile import ZIP_DEFLATED, ZipFile

from fastapi import HTTPException

from academic.contract import analyze, validate_case
from ..providers import ExtractionRequest
from ..schemas import FactEnvelope

TERMINAL = {"completed", "failed", "cancelled"}
PROMPT = Path(__file__).resolve().parents[2] / "prompts" / "extracao-1.0.0.md"
TRANSITIONS = {
    "queued": {"extracting", "validating"},
    "extracting": {"awaiting_manual", "validating"},
    "awaiting_manual": {"queued"},
    "validating": {"inferring"},
    "inferring": {"completed"},
}


@dataclass
class Job:
    id: str
    owner: str
    mode: str
    key: str | None
    fingerprint: str
    status: str = "queued"
    error: str | None = None
    profile: dict = field(default_factory=dict)
    documents: dict[str, tuple[Path, int]] = field(default_factory=dict)
    candidates: dict | None = None
    result: dict | None = None
    expires_at: float | None = None
    task: asyncio.Task | None = None

    def view(self) -> dict:
        return {"analysis_id": self.id, "status": self.status, "extraction_mode": self.mode, "error": self.error}


class Jobs:
    def __init__(self, settings, provider, knowledge):
        self.settings = settings
        self.provider = provider
        self.knowledge = knowledge
        self.prompt = PROMPT.read_text(encoding="utf-8")
        settings.state_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        self.upload_dir = settings.state_dir / "uploads"
        self.upload_dir.mkdir(mode=0o700, exist_ok=True)
        for candidate in self.upload_dir.iterdir():
            try:
                generated = UUID(candidate.name).hex == candidate.name
            except ValueError:
                generated = False
            if generated and not candidate.is_symlink() and candidate.is_dir():
                shutil.rmtree(candidate)

        self.db = sqlite3.connect(settings.state_dir / "jobs.sqlite3")
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, owner TEXT, mode TEXT, "
            "client_key TEXT, fingerprint TEXT, status TEXT, error TEXT)"
        )
        self.db.execute(
            "UPDATE jobs SET status='failed', error='restart' "
            "WHERE status NOT IN ('failed', 'cancelled')"
        )
        self.db.commit()
        self.jobs = {}
        self.keys = {}
        for row in self.db.execute("SELECT id, owner, mode, client_key, fingerprint, status, error FROM jobs ORDER BY rowid"):
            job = Job(*row)
            self.jobs[job.id] = job
            if job.key is not None:
                self.keys[(job.owner, job.key)] = job.id
        self.queue = asyncio.Queue(maxsize=settings.queue_size)
        self.worker = asyncio.create_task(self._work())

    async def close(self):
        self.worker.cancel()
        with suppress(asyncio.CancelledError):
            await self.worker
        for job in self.jobs.values():
            if job.status not in TERMINAL:
                self._transition(job, "failed", "shutdown")
        self.db.close()

    def _save(self, job):
        self.db.execute(
            "INSERT INTO jobs VALUES (?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET status=excluded.status, error=excluded.error",
            (job.id, job.owner, job.mode, job.key, job.fingerprint, job.status, job.error),
        )
        self.db.commit()

    def _clean(self, job):
        folder = self.upload_dir / job.id
        if folder.is_dir():
            shutil.rmtree(folder)
        job.documents.clear()
        job.candidates = None

    def _transition(self, job, status, error=None):
        if job.status in TERMINAL:
            return
        if status not in {"failed", "cancelled"} and status not in TRANSITIONS.get(job.status, ()):
            raise RuntimeError("Transição inválida.")
        job.status, job.error = status, error
        self._save(job)
        if status in TERMINAL:
            self._clean(job)

    def _capacity(self):
        if self.queue.full():
            raise HTTPException(503, "queue_full")
        if len(self.jobs) < self.settings.max_jobs:
            return
        oldest = next((job for job in self.jobs.values() if job.status in TERMINAL), None)
        if oldest is None:
            raise HTTPException(503, "job_limit")
        self.db.execute("DELETE FROM jobs WHERE id = ?", (oldest.id,))
        self.db.commit()
        del self.jobs[oldest.id]
        if oldest.key is not None:
            del self.keys[(oldest.owner, oldest.key)]

    def submit(self, owner, idempotency_key, profile, uploads):
        digest = hashlib.sha256(json.dumps(profile, sort_keys=True).encode("utf-8"))
        for data, _ in uploads:
            digest.update(hashlib.sha256(data).digest())
        fingerprint = digest.hexdigest()
        known = self.keys.get((owner, idempotency_key))
        if known is not None:
            job = self.jobs[known]
            if job.fingerprint != fingerprint:
                raise HTTPException(409, "idempotency_conflict")
            return job

        self._capacity()
        job = Job(uuid4().hex, owner, self.provider.mode, idempotency_key, fingerprint, profile=profile)
        folder = self.upload_dir / job.id
        folder.mkdir(mode=0o700)
        try:
            for index, (data, pages) in enumerate(uploads, start=1):
                path = folder / (uuid4().hex + ".pdf")
                path.write_bytes(data)
                job.documents[f"D{index:02d}"] = (path, pages)
            self._save(job)
        except BaseException:
            self._clean(job)
            raise
        self.jobs[job.id] = job
        if idempotency_key is not None:
            self.keys[(owner, idempotency_key)] = job.id
        self.queue.put_nowait(job.id)
        return job

    def for_owner(self, owner, job_id):
        job = self.jobs.get(job_id)
        if job is None or job.owner != owner:
            raise HTTPException(404, "analysis_not_found")
        self._expire(job)
        return job

    def cancel(self, job):
        self._transition(job, "cancelled")
        if job.task:
            job.task.cancel()

    def _request(self, job):
        return ExtractionRequest(job.profile, tuple(job.documents))

    def export(self, job):
        if job.status != "awaiting_manual":
            raise HTTPException(409, "manual_not_ready")
        output = BytesIO()
        with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
            archive.writestr("facts.json", json.dumps(self._request(job).template(), ensure_ascii=False, indent=2))
            archive.writestr(PROMPT.name, self.prompt)
            archive.writestr("chaves-fatos.json", json.dumps(self.knowledge["facts"], ensure_ascii=False, indent=2))
            for identifier, (path, _) in job.documents.items():
                archive.write(path, f"documents/{identifier}.pdf")
        return output.getvalue()

    def _validate(self, job, candidates):
        candidates = FactEnvelope.model_validate(candidates).model_dump()
        if any(candidates.get(key) != value for key, value in job.profile.items()):
            raise ValueError("O candidato não corresponde ao perfil do job.")
        facts = validate_case(candidates, self.knowledge)
        if {doc["id"] for doc in candidates["documents"]} != job.documents.keys():
            raise ValueError("As referências de documentos não correspondem ao job.")
        for fact in facts.values():
            for evidence in fact["evidence"]:
                if evidence["page"] > job.documents[evidence["document_id"]][1]:
                    raise ValueError("Página fora do documento.")
        return candidates

    def import_facts(self, job, candidates):
        if job.status != "awaiting_manual":
            raise HTTPException(409, "manual_not_ready")
        if self.queue.full():
            raise HTTPException(503, "queue_full")
        try:
            job.candidates = self._validate(job, candidates)
        except (TypeError, ValueError, KeyError) as exc:
            raise HTTPException(422, "invalid_facts") from exc
        self._transition(job, "queued")
        self.queue.put_nowait(job.id)

    def _expire(self, job):
        if job.status == "awaiting_manual" and job.expires_at <= asyncio.get_running_loop().time():
            self._transition(job, "failed", "manual_expired")

    async def _work(self):
        while True:
            try:
                identifier = await asyncio.wait_for(self.queue.get(), timeout=1)
            except TimeoutError:
                for job in self.jobs.values():
                    self._expire(job)
                continue
            job = self.jobs.get(identifier)
            try:
                if job is None or job.status != "queued":
                    continue
                job.task = asyncio.create_task(self._process(job))
                try:
                    await asyncio.wait_for(job.task, self.settings.process_timeout)
                except TimeoutError:
                    self._transition(job, "failed", "processing_timeout")
                except asyncio.CancelledError:
                    if job.status != "cancelled" or asyncio.current_task().cancelling():
                        raise
                except Exception:
                    self._transition(job, "failed", "processing_failed")
            finally:
                if job is not None:
                    job.task = None
                self.queue.task_done()

    async def _process(self, job):
        candidates = job.candidates
        if candidates is None:
            self._transition(job, "extracting")
            candidates = await self.provider.extract(self._request(job))
            if candidates is None:
                job.expires_at = asyncio.get_running_loop().time() + self.settings.manual_timeout
                self._transition(job, "awaiting_manual")
                return
        self._transition(job, "validating")
        candidates = self._validate(job, candidates)
        self._transition(job, "inferring")
        job.result = await asyncio.to_thread(analyze, candidates, self.knowledge, {})
        self._transition(job, "completed")
