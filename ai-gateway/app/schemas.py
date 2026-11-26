"""Contratos externos do gateway."""
from typing import Literal
from pydantic import BaseModel, ConfigDict

Status = Literal["queued", "extracting", "awaiting_manual", "validating", "inferring", "completed", "failed", "cancelled"]


class Accepted(BaseModel):
    analysis_id: str
    status: Status


class JobStatus(Accepted):
    extraction_mode: Literal["manual", "fake_demo"]
    error: str | None = None


class AnalysisResult(BaseModel):
    extraction_mode: Literal["manual", "fake_demo"]
    report: dict


class StrictRecord(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class Document(StrictRecord):
    id: str
    type: str


class Evidence(StrictRecord):
    document_id: str
    page: int
    excerpt: str


class Quantity(StrictRecord):
    amount: int | float
    unit: str


FactValue = bool | str | Quantity


class Fact(StrictRecord):
    key: str
    value: FactValue | None
    state: Literal["confirmado", "desconhecido", "contraditorio"]
    evidence: list[Evidence]


class Alternative(StrictRecord):
    value: FactValue
    evidence: list[Evidence]


class Conflict(StrictRecord):
    key: str
    alternatives: list[Alternative]


class FactEnvelope(StrictRecord):
    schema_version: Literal["0.1.0"]
    protocol_id: str
    protocol_version: str
    reference_date: str
    documents: list[Document]
    facts: list[Fact]
    conflicts: list[Conflict]
    warnings: list[str]
