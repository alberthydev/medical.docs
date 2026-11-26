"""Interface pública do núcleo acadêmico Python."""
from collections.abc import Mapping
from typing import Literal, TypeAlias

from .engine import analyze, explain, infer, validate_case

__all__ = ["analyze", "explain", "infer", "validate_case", "ENGINE_VERSION", "Record", "Status"]

Record: TypeAlias = Mapping[str, object]
Status: TypeAlias = Literal["conforme", "pendente", "nao_conforme", "nao_aplicavel"]
ENGINE_VERSION = "1.1.0"
