"""Verificação de PDFs e contagem do corpo da requisição."""
from io import BytesIO
import re

from fastapi import HTTPException
from pypdf import PdfReader
from starlette.responses import JSONResponse

SAFE_NAME = re.compile(r"[^\\/:<>|?*\x00-\x1f]{1,128}", re.IGNORECASE)


def pdf_pages(data: bytes) -> int:
    if not data.startswith(b"%PDF-"):
        raise HTTPException(422, "pdf_signature")
    try:
        pdf = PdfReader(BytesIO(data), strict=True)
        if pdf.is_encrypted:
            raise ValueError("PDF cifrado.")
        pages = len(pdf.pages)
        if not pages:
            raise ValueError("PDF sem páginas.")
        return pages
    except Exception as exc:
        raise HTTPException(422, "pdf_invalid") from exc


class BodyLimit:
    """Limite HTTP para requisições com ou sem Content-Length."""

    def __init__(self, app, upload_bytes: int, facts_bytes: int):
        self.app = app
        self.upload_bytes = upload_bytes
        self.facts_bytes = facts_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST":
            await self.app(scope, receive, send)
            return
        limit = self.facts_bytes if scope["path"].endswith("/facts") else self.upload_bytes + 65536
        headers = dict(scope["headers"])
        raw_length = headers.get(b"content-length")
        if raw_length is not None:
            try:
                size = int(raw_length)
                if size < 0:
                    raise ValueError
            except ValueError:
                await JSONResponse({"detail": "content_length"}, status_code=400)(scope, receive, send)
                return
            if size > limit:
                await JSONResponse({"detail": "body_limit"}, status_code=413)(scope, receive, send)
                return
        count = 0

        async def limited_receive():
            nonlocal count
            message = await receive()
            count += len(message.get("body", b""))
            if count > limit:
                raise HTTPException(413, "body_limit")
            return message

        await self.app(scope, limited_receive, send)
