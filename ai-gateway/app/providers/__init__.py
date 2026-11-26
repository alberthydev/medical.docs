"""Provedores internos sem acesso à rede."""
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ExtractionRequest:
    profile: dict
    document_ids: tuple[str, ...]

    def template(self) -> dict:
        return {
            **self.profile,
            "documents": [{"id": identifier, "type": "outro"} for identifier in self.document_ids],
            "facts": [],
            "conflicts": [],
            "warnings": [],
        }


class Provider(Protocol):
    mode: str

    async def extract(self, request: ExtractionRequest) -> dict | None: ...


class ManualProvider:
    mode = "manual"

    async def extract(self, request: ExtractionRequest) -> None:
        return None


class FakeProvider:
    mode = "fake_demo"

    async def extract(self, request: ExtractionRequest) -> dict:
        candidates = request.template()
        candidates["warnings"].append("Demonstração com extrator simulado. Nenhuma evidência foi extraída.")
        return candidates
