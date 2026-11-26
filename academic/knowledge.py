"""Carregamento e validação da base declarativa, sem executar regras."""
from datetime import date
from graphlib import CycleError, TopologicalSorter
import json
from math import isfinite
from pathlib import Path
from urllib.parse import urlsplit

DEFAULT_KNOWLEDGE = Path(__file__).parent / "knowledge" / "asma-ceaf-sc-omalizumabe.json"

CONDITION_FIELDS = {
    "equals": ({"input", "expected"}, set()),
    "one_of": ({"input", "expected"}, set()),
    "range": ({"input", "min", "min_inclusive"}, {"max", "max_inclusive", "review_values"}),
    "conditional_document": ({"applicable", "attached"}, set()),
    "dose_match": ({"weight", "ige", "dose", "interval", "table"}, set()),
    "aggregate": ({"inputs"}, set()),
}


def _require(condition, message):
    if not condition:
        raise ValueError(message)


def _fields(value, required, optional, context):
    _require(isinstance(value, dict), f"{context}: objeto esperado.")
    _require(required <= value.keys() <= required | optional, f"{context}: campos inválidos.")


def _text(value):
    return isinstance(value, str) and bool(value.strip())


def _number(value):
    return type(value) is int or (type(value) is float and isfinite(value))


def _reference(ref, catalog, kind, context, value_type=None):
    _fields(ref, {kind}, set(), context)
    key = ref[kind]
    _require(_text(key) and key in catalog, f"{context}: referência inválida a {key!r}.")
    if value_type is not None:
        _require(catalog[key]["type"] == value_type, f"{context}: tipo incompatível em {key}.")
    return key


def _validate_condition(condition, facts, rules, context):
    _require(isinstance(condition, dict), f"{context}: condição inválida.")
    op = condition.get("op")
    _require(_text(op) and op in CONDITION_FIELDS, f"{context}: operador desconhecido.")
    required, optional = CONDITION_FIELDS[op]
    _fields(condition, {"op"} | required, optional, context)

    if op == "aggregate":
        refs = condition["inputs"]
        _require(isinstance(refs, list) and len(refs) >= 2, f"{context}: dependências insuficientes.")
        dependencies = [_reference(ref, rules, "rule", context) for ref in refs]
        _require(len(dependencies) == len(set(dependencies)), f"{context}: dependência duplicada.")
        return dependencies

    if op in ("equals", "one_of", "range"):
        key = _reference(condition["input"], facts, "fact", context)
        value_type = facts[key]["type"]
        if op == "equals":
            expected = condition["expected"]
            _require(
                (value_type == "boolean" and type(expected) is bool)
                or (value_type == "text" and _text(expected)),
                f"{context}: comparação incompatível com o tipo.",
            )
        elif op == "one_of":
            values = condition["expected"]
            _require(
                value_type == "text" and isinstance(values, list) and values
                and all(_text(value) for value in values) and len(set(values)) == len(values),
                f"{context}: conjunto de valores incompatível ou duplicado.",
            )
        else:
            _require(value_type == "quantity", f"{context}: faixa exige quantidade.")
            minimum = condition["min"]
            _require(_number(minimum) and type(condition["min_inclusive"]) is bool, f"{context}: mínimo inválido.")
            _require(("max" in condition) == ("max_inclusive" in condition), f"{context}: máximo incompleto.")
            if "max" in condition:
                maximum = condition["max"]
                _require(
                    _number(maximum) and minimum < maximum and type(condition["max_inclusive"]) is bool,
                    f"{context}: máximo inválido.",
                )
            review = condition.get("review_values", [])
            _require(isinstance(review, list) and all(_number(value) for value in review), f"{context}: limiares inválidos.")

    if op == "conditional_document":
        for field in ("applicable", "attached"):
            _reference(condition[field], facts, "fact", context, "boolean")

    if op == "dose_match":
        _require(condition["table"] == "ses-sc-asma-2026-09-t1", f"{context}: tabela desconhecida.")
        for field, unit in (("weight", "kg"), ("ige", "UI/mL"), ("dose", "mg"), ("interval", "semana")):
            key = _reference(condition[field], facts, "fact", context, "quantity")
            _require(facts[key]["unit"] == unit, f"{context}: unidade incompatível em {key}.")

    return []


def validate_knowledge(base: dict) -> None:
    """Verifique estrutura, fontes, operandos e grafo de dependências."""
    metadata = {"knowledge_version", "schema_version", "protocol_id", "protocol_version", "first_reference_date"}
    expected = metadata | {"scope", "scope_rule_id", "final_rule_id", "facts", "sources", "rules"}
    _fields(base, expected, set(), "Base")
    _require(all(_text(base[key]) for key in metadata), "Metadados vazios.")
    reference_date = base["first_reference_date"]
    _require(date.fromisoformat(reference_date).isoformat() == reference_date, "Data de recorte inválida.")
    facts = base["facts"]
    sources = base["sources"]
    _require(isinstance(facts, dict) and facts, "Catálogo de fatos vazio ou inválido.")
    _require(isinstance(sources, dict) and sources, "Catálogo de fontes vazio ou inválido.")

    for key, spec in facts.items():
        _fields(spec, {"type"}, {"unit"}, f"Fato {key}")
        category = spec["type"]
        _require(category in ("boolean", "text", "quantity", "date"), f"Fato {key}: tipo inválido.")
        if category == "quantity":
            _require(_text(spec.get("unit")), f"Fato {key}: unidade obrigatória.")
        else:
            _require("unit" not in spec, f"Fato {key}: unidade inesperada.")

    _fields(base["scope"], {"modalidade", "medicamento"}, set(), "Escopo")
    for key, value in base["scope"].items():
        _require(_text(value) and facts.get(key, {}).get("type") == "text", f"Escopo: valor inválido em {key}.")

    for source_id, source in sources.items():
        _fields(source, {"edition", "url"}, {"file"}, f"Fonte {source_id}")
        _require(_text(source["edition"]) and _text(source["url"]), f"Fonte {source_id}: edição ou URL vazia.")
        url = urlsplit(source["url"])
        _require(url.scheme == "https" and url.hostname, f"Fonte {source_id}: URL HTTPS inválida.")
        if "file" in source:
            _require(
                _text(source["file"]) and source["file"].startswith("docs/fontes-asma/")
                and ".." not in source["file"].split("/"),
                f"Fonte {source_id}: caminho inválido.",
            )

    rules = base["rules"]
    _require(isinstance(rules, list) and rules, "Lista de regras vazia ou inválida.")
    rule_index = {}
    conclusions = set()
    conditions = set()
    for rule in rules:
        _fields(rule, {"id", "layer", "priority", "condition", "conclusion", "sources"}, set(), "Regra")
        rule_id = rule["id"]
        _require(_text(rule_id) and rule_id not in rule_index, f"ID de regra inválido ou duplicado: {rule_id!r}.")
        _require(type(rule["priority"]) is int and rule["priority"] > 0, f"{rule_id}: prioridade inválida.")
        _require(rule["layer"] in ("intermediaria", "documental"), f"{rule_id}: camada inválida.")
        conclusion = rule["conclusion"]
        _fields(conclusion, {"key", "description"}, set(), rule_id)
        _require(
            _text(conclusion["key"]) and _text(conclusion["description"]) and conclusion["key"] not in conclusions,
            f"{rule_id}: conclusão inválida ou duplicada.",
        )
        _require(conclusion["key"] == rule_id, f"{rule_id}: chave de conclusão incompatível com o ID.")
        signature = json.dumps(rule["condition"], sort_keys=True, ensure_ascii=False)
        _require(signature not in conditions, f"{rule_id}: condição de regra duplicada.")
        conditions.add(signature)
        conclusions.add(conclusion["key"])
        rule_index[rule_id] = rule

    scope_id = base["scope_rule_id"]
    _require(_text(scope_id) and scope_id not in rule_index, "ID do escopo inválido.")
    final_id = base["final_rule_id"]
    _require(
        _text(final_id) and [rule["id"] for rule in rules if rule["layer"] == "documental"] == [final_id],
        "A base deve ter uma única regra documental final.",
    )

    graph = {}
    for rule_id, rule in rule_index.items():
        dependencies = _validate_condition(rule["condition"], facts, rule_index, rule_id)
        citations = rule["sources"]
        _require(isinstance(citations, list) and (dependencies or citations), f"{rule_id}: regra sem fonte.")
        for citation in citations:
            _fields(citation, {"source_id", "locator"}, {"page"}, rule_id)
            source_id = citation["source_id"]
            _require(_text(source_id) and source_id in sources, f"{rule_id}: fonte desconhecida.")
            _require(_text(citation["locator"]), f"{rule_id}: localizador vazio.")
            if "page" in citation:
                _require(type(citation["page"]) is int and citation["page"] > 0, f"{rule_id}: página inválida.")
            if "file" in sources[source_id]:
                _require("page" in citation, f"{rule_id}: página do PDF obrigatória.")
        graph[rule_id] = dependencies

    try:
        tuple(TopologicalSorter(graph).static_order())
    except CycleError as exc:
        raise ValueError("Ciclo no grafo de dependências da base.") from exc
    _require(bool(graph[final_id]), "A conclusão documental precisa depender de outras regras.")
    reachable = {final_id}
    pending = [final_id]
    while pending:
        for dependency in graph[pending.pop()]:
            if dependency not in reachable:
                reachable.add(dependency)
                pending.append(dependency)
    _require(reachable == graph.keys(), "Há regra sem caminho até a conclusão documental.")


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        _require(key not in result, f"Chave JSON duplicada: {key}.")
        result[key] = value
    return result


def load_knowledge(path: Path = DEFAULT_KNOWLEDGE) -> dict:
    base = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=_unique_object)
    validate_knowledge(base)
    return base
