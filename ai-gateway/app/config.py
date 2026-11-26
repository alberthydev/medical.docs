"""Configuração do gateway interno."""
from dataclasses import dataclass
from os import environ
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    service_token: str
    state_dir: Path
    provider: str = "manual"
    queue_size: int = 8
    max_jobs: int = 256
    max_files: int = 10
    max_pages: int = 100
    max_upload_bytes: int = 8 * 1024 * 1024
    max_facts_bytes: int = 1024 * 1024
    process_timeout: float = 20
    manual_timeout: float = 1800

    def __post_init__(self):
        if len(self.service_token) < 24 or not self.service_token.isascii():
            raise ValueError("AI_SERVICE_TOKEN precisa de pelo menos 24 caracteres ASCII.")
        if self.provider not in ("manual", "fake"):
            raise ValueError("AI_PROVIDER desconhecido.")
        if min(self.queue_size, self.max_jobs, self.max_files, self.max_pages,
               self.max_upload_bytes, self.max_facts_bytes, self.process_timeout, self.manual_timeout) <= 0:
            raise ValueError("Limites do gateway precisam ser positivos.")

    @classmethod
    def from_env(cls):
        return cls(
            service_token=environ.get("AI_SERVICE_TOKEN", ""),
            state_dir=Path(environ.get("AI_STATE_DIR", ".gateway-state")),
            provider=environ.get("AI_PROVIDER", "manual"),
            queue_size=int(environ.get("AI_QUEUE_SIZE", "8")),
            max_jobs=int(environ.get("AI_MAX_JOBS", "256")),
            max_files=int(environ.get("AI_MAX_FILES", "10")),
            max_pages=int(environ.get("AI_MAX_PAGES", "100")),
            max_upload_bytes=int(environ.get("AI_MAX_UPLOAD_BYTES", str(8 * 1024 * 1024))),
            max_facts_bytes=int(environ.get("AI_MAX_FACTS_BYTES", str(1024 * 1024))),
            process_timeout=float(environ.get("AI_PROCESS_TIMEOUT", "20")),
            manual_timeout=float(environ.get("AI_MANUAL_TIMEOUT", "1800")),
        )
