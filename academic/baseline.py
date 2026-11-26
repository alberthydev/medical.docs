"""Checklist fixo de conferência documental para processos sintéticos."""
from collections.abc import Mapping, Sequence
from math import isfinite

from .contract import Record, Status
from .dose_table import lookup_dose

VERSION = "1.0.0"
ADMIN_FIELDS = {
    "A01": "cns_presente",
    "A02": "identidade_presente",
    "A03": "comprovante_residencia_presente",
    "A04": "lme_completo",
    "A05": "prescricao_completa",
    "A06": "formulario_item4_completo",
    "A07": "ter_completo",
    "A08": "exame_ige_basal_documentado",
}
CLINICAL_FIELDS = {
    "C02": "sintomas_compativeis",
    "C03": "outros_diagnosticos_excluidos",
    "C05": "asma_alergica_grave_nao_controlada",
    "C06": "dose_alta_ci_com_laba",
    "C09": "exacerbacao_grave_com_co_ultimo_ano",
}


def _status(result: bool | None) -> Status:
    if result is None:
        return "pendente"
    return "conforme" if result else "nao_conforme"


def _fact_index(facts: Sequence[Record]) -> dict[str, Record]:
    indexed: dict[str, Record] = {}
    for fact in facts:
        key = fact.get("key")
        if not isinstance(key, str) or not key:
            raise ValueError("Fato sem chave válida.")
        if key in indexed:
            raise ValueError(f"Chave de fato duplicada: {key}")
        indexed[key] = fact
    return indexed


def _read(facts: Mapping[str, Record], key: str) -> object:
    fact = facts.get(key)
    if fact and fact.get("state") == "confirmado" and fact.get("evidence"):
        return fact.get("value")
    return None


def _boolean(facts: Mapping[str, Record], key: str) -> bool | None:
    value = _read(facts, key)
    return value if isinstance(value, bool) else None


def _quantity(facts: Mapping[str, Record], key: str, unit: str) -> float | None:
    value = _read(facts, key)
    if not isinstance(value, Mapping) or value.get("unit") != unit:
        return None
    amount = value.get("amount")
    if type(amount) not in (int, float) or (type(amount) is float and not isfinite(amount)):
        return None
    return amount


def _functional_exam(facts: Mapping[str, Record]) -> Status:
    possible = _boolean(facts, "exame_funcional_possivel")
    attached = _boolean(facts, "exame_funcional_anexado")
    if possible is False:
        return "pendente" if attached is True else "nao_aplicavel"
    return _status(attached) if possible is True else "pendente"


def assess_checklist(facts: Sequence[Record]) -> tuple[Status, dict[str, Status]]:
    """Faça consultas diretas aos fatos e à tabela, com consolidação fixa."""
    index = _fact_index(facts)
    modality = _read(index, "modalidade")
    drug = _read(index, "medicamento")
    if (isinstance(modality, str) and modality != "inicial") or (
        isinstance(drug, str) and drug != "omalizumabe"
    ):
        return "nao_aplicavel", {"escopo": "nao_aplicavel"}
    if modality != "inicial" or drug != "omalizumabe":
        return "pendente", {"escopo": "pendente"}

    checks = {rule: _status(_boolean(index, key)) for rule, key in ADMIN_FIELDS.items()}
    checks.update({rule: _status(_boolean(index, key)) for rule, key in CLINICAL_FIELDS.items()})

    checks["A09"] = _functional_exam(index)
    cid = _read(index, "cid10")
    checks["C01"] = _status(cid in ("J45.0", "J45.8") if isinstance(cid, str) else None)
    age = _quantity(index, "idade", "ano")
    checks["C04"] = _status(None if age is None or age == 6 else age > 6)
    weight = _quantity(index, "peso", "kg")
    ige = _quantity(index, "ige_total_basal", "UI/mL")
    checks["C07"] = _status(None if weight is None else 20 <= weight <= 150)
    checks["C08"] = _status(None if ige is None else 30 <= ige <= 1500)
    exclusion = _boolean(index, "impedimento_medicamento")
    checks["C10"] = _status(None if exclusion is None else not exclusion)
    route = _read(index, "via_prescrita")
    checks["C11"] = _status(route == "subcutanea" if isinstance(route, str) else None)
    dose = _quantity(index, "dose_por_aplicacao", "mg")
    interval = _quantity(index, "intervalo_prescrito", "semana")
    if weight is None or ige is None:
        checks["C12"] = "pendente"
    else:
        entry = lookup_dose(weight, ige)
        if entry is None:
            checks["C12"] = "nao_conforme"
        else:
            checks["C12"] = _status(None if dose is None or interval is None else entry == (dose, interval))

    ordered = dict(sorted(checks.items()))
    if "nao_conforme" in ordered.values():
        return "nao_conforme", ordered
    if "pendente" in ordered.values():
        return "pendente", ordered
    return "conforme", ordered


def checklist_baseline(facts: Sequence[Record]) -> Status:
    """Classifique os fatos com a lista de conferência direta."""
    status, _ = assess_checklist(facts)
    return status
