"""Rotas autenticadas do gateway."""
from datetime import date
from hashlib import sha256
import re
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from starlette.datastructures import UploadFile

from ..schemas import Accepted, AnalysisResult, JobStatus
from ..uploads import SAFE_NAME, pdf_pages

PREFIX = "/api/v1/analysis"
HEADER_ID = re.compile(r"[A-Za-z0-9_.:-]{1,128}")
PROFILE_FIELDS = {"protocol_id", "protocol_version", "reference_date", "synthetic"}


def principal(request: Request) -> str:
    expected = request.app.state.settings.service_token.encode("ascii")
    authorization = request.headers.get("authorization", "")
    if not authorization.startswith("Bearer ") or not secrets.compare_digest(authorization[7:].encode(), expected):
        raise HTTPException(401, "service_authentication_required", headers={"WWW-Authenticate": "Bearer"})
    owner = request.headers.get("x-owner-id", "")
    if not HEADER_ID.fullmatch(owner):
        raise HTTPException(400, "owner_required")
    return sha256(owner.encode("ascii")).hexdigest()


def profile_from(form, knowledge):
    for key in PROFILE_FIELDS:
        values = form.getlist(key)
        if len(values) != 1 or not isinstance(values[0], str):
            raise HTTPException(422, "invalid_profile")
    if form["synthetic"] != "true":
        raise HTTPException(422, "synthetic_data_required")
    for key in ("protocol_id", "protocol_version"):
        if form[key] != knowledge[key]:
            raise HTTPException(422, "unsupported_profile")
    try:
        reference = date.fromisoformat(form["reference_date"])
        if reference.isoformat() != form["reference_date"]:
            raise ValueError
        if reference < date.fromisoformat(knowledge["first_reference_date"]):
            raise ValueError
    except ValueError as exc:
        raise HTTPException(422, "invalid_reference_date") from exc
    return {
        "schema_version": knowledge["schema_version"],
        "protocol_id": form["protocol_id"],
        "protocol_version": form["protocol_version"],
        "reference_date": form["reference_date"],
    }


routes = APIRouter(prefix=PREFIX)


@routes.post("", response_model=Accepted, status_code=202)
async def start(request: Request, owner: str = Depends(principal)):
    settings = request.app.state.settings
    knowledge = request.app.state.knowledge
    idempotency_key = request.headers.get("idempotency-key")
    if idempotency_key is not None and not HEADER_ID.fullmatch(idempotency_key):
        raise HTTPException(400, "invalid_idempotency_key")
    if idempotency_key is not None:
        idempotency_key = sha256(idempotency_key.encode("ascii")).hexdigest()
    media_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if media_type != "multipart/form-data":
        raise HTTPException(415, "multipart_required")
    uploads = []
    bytes_left = settings.max_upload_bytes
    pages = 0
    await request.body()
    async with request.form(max_files=settings.max_files, max_fields=len(PROFILE_FIELDS)) as form:
        if set(form.keys()) - PROFILE_FIELDS - {"documents"}:
            raise HTTPException(422, "invalid_form_fields")
        profile = profile_from(form, knowledge)
        files = form.getlist("documents")
        if not 1 <= len(files) <= settings.max_files:
            raise HTTPException(422, "document_count")
        for file in files:
            if not isinstance(file, UploadFile):
                raise HTTPException(422, "file_required")
            name = file.filename or ""
            if not SAFE_NAME.fullmatch(name) or not name.lower().endswith(".pdf"):
                raise HTTPException(422, "file_name")
            if file.content_type != "application/pdf":
                raise HTTPException(415, "pdf_required")
            data = await file.read(bytes_left + 1)
            bytes_left -= len(data)
            if bytes_left < 0:
                raise HTTPException(413, "upload_limit")
            count = pdf_pages(data)
            pages += count
            if pages > settings.max_pages:
                raise HTTPException(422, "page_limit")
            uploads.append((data, count))
    job = request.app.state.jobs.submit(owner, idempotency_key, profile, uploads)
    return {"analysis_id": job.id, "status": job.status}

@routes.get("/{analysis_id}", response_model=JobStatus)
async def status(analysis_id: str, request: Request, owner: str = Depends(principal)):
    return request.app.state.jobs.for_owner(owner, analysis_id).view()

@routes.get("/{analysis_id}/result", response_model=AnalysisResult)
async def result(analysis_id: str, request: Request, response: Response, owner: str = Depends(principal)):
    job = request.app.state.jobs.for_owner(owner, analysis_id)
    if job.status != "completed":
        raise HTTPException(409, "result_not_ready")
    response.headers["Cache-Control"] = "no-store"
    return {"extraction_mode": job.mode, "report": job.result}

@routes.delete("/{analysis_id}", response_model=JobStatus)
async def cancel(analysis_id: str, request: Request, owner: str = Depends(principal)):
    jobs = request.app.state.jobs
    job = jobs.for_owner(owner, analysis_id)
    jobs.cancel(job)
    return job.view()

@routes.get("/{analysis_id}/manual")
async def export_manual(analysis_id: str, request: Request, owner: str = Depends(principal)):
    jobs = request.app.state.jobs
    content = jobs.export(jobs.for_owner(owner, analysis_id))
    return Response(content, media_type="application/zip", headers={
        "Content-Disposition": 'attachment; filename="medical-docs-sintetico.zip"',
        "Cache-Control": "no-store",
    })

@routes.post("/{analysis_id}/facts", response_model=Accepted, status_code=202)
async def import_manual(analysis_id: str, request: Request, owner: str = Depends(principal)):
    jobs = request.app.state.jobs
    job = jobs.for_owner(owner, analysis_id)
    if request.headers.get("x-manual-verified") != "true":
        raise HTTPException(422, "manual_review_required")
    if request.headers.get("content-type", "").split(";", 1)[0].strip().lower() != "application/json":
        raise HTTPException(415, "json_required")
    try:
        facts = await request.json()
    except (ValueError, UnicodeError) as exc:
        raise HTTPException(422, "invalid_json") from exc
    jobs.import_facts(job, facts)
    return {"analysis_id": job.id, "status": job.status}
