"""API interna do gateway FastAPI."""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, HTTPException, Request

from academic.knowledge import load_knowledge
from .config import Settings
from .providers import FakeProvider, ManualProvider
from .routes.analysis import PREFIX, routes
from .services import Jobs
from .uploads import BodyLimit


def create_app(settings: Settings | None = None, provider=None) -> FastAPI:
    settings = settings or Settings.from_env()
    provider = provider or (ManualProvider() if settings.provider == "manual" else FakeProvider())
    knowledge = load_knowledge()
    logging.getLogger("pypdf").setLevel(logging.CRITICAL + 1)

    @asynccontextmanager
    async def lifespan(application):
        application.state.jobs = Jobs(settings, provider, knowledge)
        try:
            yield
        finally:
            await application.state.jobs.close()

    app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
    app.state.settings = settings
    app.add_middleware(BodyLimit, upload_bytes=settings.max_upload_bytes, facts_bytes=settings.max_facts_bytes)
    app.state.knowledge = knowledge

    @app.get("/health")
    async def health(request: Request):
        if request.app.state.jobs.worker.done():
            raise HTTPException(503, "worker_unavailable")
        return {"status": "ok"}

    app.include_router(routes)
    return app
