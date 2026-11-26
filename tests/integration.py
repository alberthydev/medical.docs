"""Teste de integração dos servidores locais. Execute após npm run build."""
import base64
from io import BytesIO
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
from tempfile import TemporaryDirectory
from time import monotonic, sleep
from zipfile import ZipFile

import httpx
from pypdf import PdfWriter

ROOT = Path(__file__).resolve().parents[1]
TOKEN = "integracao-local-segredo-do-teste"
USERNAME = "auditor-sintetico"
PASSWORD = "senha-exclusiva-do-teste-local"


def local_url():
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return f"http://127.0.0.1:{listener.getsockname()[1]}"


def wait_http(client, path, process):
    deadline = monotonic() + 12
    while monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"Servidor encerrou com código {process.returncode}.")
        try:
            if client.get(path).status_code == 200:
                return
        except httpx.TransportError:
            pass
        sleep(0.15)
    raise RuntimeError(f"Servidor não respondeu em {path}.")


def wait_job(client, identifier, target):
    deadline = monotonic() + 5
    while monotonic() < deadline:
        response = client.get(f"/api/analyze/{identifier}")
        response.raise_for_status()
        result = response.json()
        if result["status"] == target:
            return
        if result["status"] in ("failed", "cancelled", "completed"):
            raise AssertionError(result)
        sleep(0.04)
    raise AssertionError(f"Job não alcançou {target}.")


def synthetic_pdf():
    output = BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.write(output)
    return "data:application/pdf;base64," + base64.b64encode(output.getvalue()).decode("ascii")


def verify_render(report):
    script = """
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParecerScreen } from './src/components/ParecerScreen.tsx';

const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const html = renderToStaticMarkup(React.createElement(ParecerScreen, {
  academicSource: report.source,
  markdownContent: report.markdown + '\\n\\n<script>doNotRender()</script>\\n\\n![x](https://example.test/x)',
  securityHash: report.securityHash,
  onCopyNotice() {},
  onUpdateMarkdown() {},
  onOpenShareModal() {},
}));
for (const pattern of [/Extração manual/, /Requisitos e evidências/, /Cópia do cartão CNS fictício anexada/, /Resumo de integridade SHA-256/]) {
  assert.ok(pattern.test(html), String(pattern));
}
assert.ok(!/<script|<img|doNotRender/.test(html), 'HTML ativo no parecer');
"""
    with TemporaryDirectory() as directory:
        artifact = Path(directory) / "report.json"
        artifact.write_text(json.dumps(report, ensure_ascii=True), encoding="utf-8")
        subprocess.run(
            ["node", "--import", "tsx", "--input-type=module", "-", str(artifact)],
            input=script, encoding="utf-8", check=True, cwd=ROOT,
        )


def exercise(app):
    facts = json.loads((ROOT / "academic/fixtures/cases.json").read_text(encoding="utf-8"))["cases"][0]["audit"]
    pdf = synthetic_pdf()
    payload = {
        "synthetic": True,
        "referenceDate": facts["reference_date"],
        "files": [{"data": pdf} for _ in facts["documents"]],
    }
    assert "Medical" in app.get("/").text
    assert app.post("/api/analyze", json=payload).status_code == 401
    assert app.post("/api/auth/login", json={"username": "admin", "password": "teste123"}).status_code == 401
    credentials = {"username": USERNAME, "password": PASSWORD}
    app.post("/api/auth/login", json=credentials).raise_for_status()
    assert app.get("/api/auth/me").json()["authenticated"]
    assert app.post("/api/analyze", json=payload, headers={"Origin": "https://example.test"}).status_code == 403
    assert app.post("/api/analyze", json={**payload, "synthetic": False}).status_code == 422
    started = app.post("/api/analyze", json=payload, headers={"Idempotency-Key": "integration-run"})
    assert started.status_code == 202, started.text
    identifier = started.json()["analysis_id"]
    again = app.post("/api/analyze", json=payload, headers={"Idempotency-Key": "integration-run"})
    assert again.json()["analysis_id"] == identifier
    wait_job(app, identifier, "awaiting_manual")
    assert app.get(f"/api/analyze/{identifier}/result").status_code == 409
    download = app.get(f"/api/analyze/{identifier}/manual")
    download.raise_for_status()
    with ZipFile(BytesIO(download.content)) as package:
        assert "extracao-1.0.0.md" in package.namelist()
        assert len(json.loads(package.read("facts.json"))["documents"]) == len(facts["documents"])
    assert app.post(f"/api/analyze/{identifier}/facts", json={"facts": facts, "reviewed": False}).status_code == 422
    invalid = {**facts, "reference_date": "2026-11-26"}
    assert app.post(f"/api/analyze/{identifier}/facts", json={"facts": invalid, "reviewed": True}).status_code == 422
    accepted = app.post(f"/api/analyze/{identifier}/facts", json={"facts": facts, "reviewed": True})
    assert accepted.status_code == 202, accepted.text
    wait_job(app, identifier, "completed")
    result = app.get(f"/api/analyze/{identifier}/result")
    result.raise_for_status()
    report = result.json()
    assert report["auditStatus"] == "conforme" and report["source"] == "manual"
    assert report["protocolNumber"].startswith("SINT-") and len(report["securityHash"]) == 72
    verify_render(report)
    changed = app.post("/api/analyze/digest", json={"markdown": report["markdown"] + "\n\nEdição humana."})
    changed.raise_for_status()
    assert changed.json()["securityHash"] != report["securityHash"]
    to_cancel = app.post("/api/analyze", json={**payload, "files": [{"data": pdf}]}).json()["analysis_id"]
    cancelled = app.delete(f"/api/analyze/{to_cancel}").json()
    assert cancelled["status"] == "cancelled"
    assert app.get(f"/api/analyze/{to_cancel}/result").status_code == 409
    app.post("/api/auth/logout").raise_for_status()
    assert app.get(f"/api/analyze/{identifier}/result").status_code == 401


def main():
    if not (ROOT / "dist/server.cjs").is_file():
        raise RuntimeError("Execute npm run build antes do teste.")
    gateway_url = local_url()
    app_url = local_url()
    with TemporaryDirectory() as temporary:
        env = {
            **os.environ,
            "AI_SERVICE_TOKEN": TOKEN,
            "AI_STATE_DIR": temporary,
            "AI_PROVIDER": "manual",
            "AI_GATEWAY_URL": gateway_url,
            "ADMIN_USERNAME": USERNAME,
            "ADMIN_PASSWORD": PASSWORD,
            "APP_URL": app_url,
            "HOST": "127.0.0.1",
            "PORT": app_url.rsplit(":", 1)[1],
            "NODE_ENV": "production",
            "COOKIE_SECURE": "false",
            "PCDT_CATALOG_URL": app_url + "/local-catalogue",
            "GOVBR_ALLOWED_SUBJECTS": "",
        }
        paths = [str(ROOT / "ai-gateway"), os.getenv("PYTHONPATH", "")]
        env["PYTHONPATH"] = os.pathsep.join(path for path in paths if path)
        processes = []
        try:
            processes.append(subprocess.Popen(
                [sys.executable, "-B", "-m", "uvicorn", "app.main:create_app", "--factory",
                 "--host", "127.0.0.1", "--port", gateway_url.rsplit(":", 1)[1], "--no-access-log"],
                env=env, cwd=ROOT, stdout=subprocess.DEVNULL,
            ))
            processes.append(subprocess.Popen(
                ["node", "dist/server.cjs"], cwd=ROOT, env=env, stdout=subprocess.DEVNULL,
            ))
            with httpx.Client(base_url=gateway_url, trust_env=False) as gateway, \
                    httpx.Client(base_url=app_url, trust_env=False) as app:
                wait_http(gateway, "/health", processes[0])
                wait_http(app, "/api/health", processes[1])
                exercise(app)
                if os.getenv("MEDICAL_PLAYWRIGHT_ROOT"):
                    fixture = json.loads((ROOT / "academic/fixtures/cases.json").read_text(encoding="utf-8"))
                    browser_input = Path(temporary) / "browser.json"
                    browser_input.write_text(json.dumps({
                        "baseUrl": app_url, "username": USERNAME, "password": PASSWORD,
                        "facts": fixture["cases"][0]["audit"], "pdf": synthetic_pdf().split(",", 1)[1],
                    }), encoding="utf-8")
                    subprocess.run(["node", "tests/browser-integration.mjs", str(browser_input)], check=True, cwd=ROOT)
        finally:
            for process in reversed(processes):
                if process.poll() is None:
                    process.terminate()
                    process.wait(timeout=5)
    print("Integração local passou: sessão, CSRF, upload, idempotência, extração manual, inferência, renderização, edição e cancelamento.")


if __name__ == "__main__":
    main()
