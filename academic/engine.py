"""Inferência documental determinística para o perfil acadêmico."""
from datetime import date
from math import isfinite
import re

from .dose_table import lookup_dose
from .knowledge import validate_knowledge

PROFILE_KEYS = ("schema_version", "protocol_id", "protocol_version")
IDENTIFIER = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]*")
DOCUMENT_TYPES = {
    "cns", "identidade", "comprovante_residencia", "lme", "prescricao",
    "formulario_asma", "ter", "exame", "relato_medico", "outro",
}
LIMITATION = "Conferência documental de um perfil acadêmico sintético. A conclusão exige revisão humana."


def _fields(obj, keys, context):
    if not isinstance(obj, dict) or obj.keys() != keys:
        raise ValueError(f"{context}: campos inválidos.")


def _list(value, context):
    if not isinstance(value, list):
        raise ValueError(f"{context}: lista esperada.")
    return value


def _date(value):
    if not isinstance(value, str):
        raise ValueError("Data ISO esperada.")
    parsed = date.fromisoformat(value)
    if parsed.isoformat() != value:
        raise ValueError("Use data ISO no formato AAAA-MM-DD.")
    return parsed


def _value(value, spec, key):
    category = spec["type"]
    if category == "date":
        _date(value)
        return
    if category == "boolean" and type(value) is bool:
        return
    if category == "text" and isinstance(value, str) and value.strip():
        return
    if category == "quantity":
        _fields(value, {"amount", "unit"}, key)
        amount = value["amount"]
        numeric = type(amount) is int or (type(amount) is float and isfinite(amount))
        if numeric and value["unit"] == spec["unit"]:
            return
    raise ValueError(f"{key}: valor ou unidade incompatível.")


def _evidence(entries, documents, context):
    for entry in _list(entries, context):
        _fields(entry, {"document_id", "page", "excerpt"}, context)
        identifier = entry["document_id"]
        if not isinstance(identifier, str) or identifier not in documents:
            raise ValueError(f"{context}: documento da evidência desconhecido.")
        if type(entry["page"]) is not int or entry["page"] < 1:
            raise ValueError(f"{context}: página de evidência inválida.")
        if not isinstance(entry["excerpt"], str) or not entry["excerpt"].strip():
            raise ValueError(f"{context}: trecho de evidência vazio.")


def validate_case(case, protocol):
    """Valide o envelope e devolva o índice dos fatos observados."""
    _fields(case, {*PROFILE_KEYS, "reference_date", "documents", "facts", "conflicts", "warnings"}, "Solicitação")
    if any(case[key] != protocol[key] for key in PROFILE_KEYS):
        raise ValueError("Versão ou protocolo incompatível.")
    if _date(case["reference_date"]) < _date(protocol["first_reference_date"]):
        raise ValueError("Data anterior ao recorte temporal do experimento.")
    if any(not isinstance(item, str) or not item.strip() for item in _list(case["warnings"], "Avisos")):
        raise ValueError("Aviso inválido.")

    documents = set()
    for document in _list(case["documents"], "Documentos"):
        _fields(document, {"id", "type"}, "Documento")
        key = document["id"]
        if not isinstance(key, str) or not IDENTIFIER.fullmatch(key) or key in documents:
            raise ValueError("ID de documento inválido ou duplicado.")
        if not isinstance(document["type"], str) or document["type"] not in DOCUMENT_TYPES:
            raise ValueError(f"{key}: tipo de documento inválido.")
        documents.add(key)

    catalog = protocol["facts"]
    facts = {}
    for fact in _list(case["facts"], "Fatos"):
        _fields(fact, {"key", "value", "state", "evidence"}, "Fato")
        key = fact["key"]
        if not isinstance(key, str) or key not in catalog or key in facts:
            raise ValueError(f"Chave de fato desconhecida ou duplicada: {key!r}.")
        _evidence(fact["evidence"], documents, key)
        state = fact["state"]
        if state == "confirmado":
            _value(fact["value"], catalog[key], key)
            if not fact["evidence"]:
                raise ValueError(f"{key}: fato confirmado sem evidência.")
        elif state in ("desconhecido", "contraditorio"):
            if fact["value"] is not None or (state == "contraditorio" and len(fact["evidence"]) < 2):
                raise ValueError(f"{key}: estado sem valor conclusivo inválido.")
        else:
            raise ValueError(f"{key}: estado inválido.")
        facts[key] = fact

    conflicts = set()
    for conflict in _list(case["conflicts"], "Conflitos"):
        _fields(conflict, {"key", "alternatives"}, "Conflito")
        key = conflict["key"]
        if not isinstance(key, str) or key in conflicts or facts.get(key, {}).get("state") != "contraditorio":
            raise ValueError("Conflito duplicado ou sem fato contraditório.")
        values = []
        for alternative in _list(conflict["alternatives"], key):
            _fields(alternative, {"value", "evidence"}, key)
            _value(alternative["value"], catalog[key], key)
            evidence = alternative["evidence"]
            _evidence(evidence, documents, key)
            if not evidence or any(entry not in facts[key]["evidence"] for entry in evidence):
                raise ValueError(f"{key}: conflito sem evidência vinculada ao fato.")
            values.append(alternative["value"])
        if not values or all(value == values[0] for value in values):
            raise ValueError(f"{key}: conflito exige valores distintos.")
        conflicts.add(key)
    if conflicts != {key for key, fact in facts.items() if fact["state"] == "contraditorio"}:
        raise ValueError("Fato contraditório sem alternativas registradas.")
    return facts


def _confirmed(facts, key):
    fact = facts.get(key)
    return fact["value"] if fact and fact["state"] == "confirmado" else None


def _status(check):
    if check is None:
        return "pendente"
    return "conforme" if check else "nao_conforme"


def _test_condition(condition, premises, facts, derived, aggregation):
    op = condition["op"]
    if op == "aggregate":
        statuses = {derived[key]["status"] for key in premises}
        if aggregation == "incerteza_primeiro" and "pendente" in statuses:
            return "pendente"
        if "nao_conforme" in statuses:
            return "nao_conforme"
        if "pendente" in statuses:
            return "pendente"
        return "conforme" if "conforme" in statuses else "nao_aplicavel"

    values = [_confirmed(facts, key) for key in premises]
    if op == "conditional_document":
        possible, attached = values
        if possible is False:
            return "pendente" if attached is True else "nao_aplicavel"
        return _status(attached) if possible is True else "pendente"
    if op == "dose_match":
        weight, ige, dose, interval = values
        if weight is None or ige is None:
            return "pendente"
        dose_pair = lookup_dose(weight["amount"], ige["amount"])
        if dose_pair is None:
            return "nao_conforme"
        return _status(None if dose is None or interval is None else dose_pair == (dose["amount"], interval["amount"]))

    value = values[0]
    if value is None:
        return "pendente"
    if op == "equals":
        return _status(value == condition["expected"])
    if op == "one_of":
        return _status(value in condition["expected"])
    amount = value["amount"]
    if amount in condition.get("review_values", ()):
        return "pendente"
    minimum = condition["min"]
    above_min = amount > minimum or (amount == minimum and condition["min_inclusive"])
    maximum = condition.get("max")
    below_max = maximum is None or amount < maximum or (amount == maximum and condition["max_inclusive"])
    return _status(above_min and below_max)


def _premises(condition):
    op = condition["op"]
    if op == "aggregate":
        return [ref["rule"] for ref in condition["inputs"]]
    if op == "conditional_document":
        return [condition[field]["fact"] for field in ("applicable", "attached")]
    if op == "dose_match":
        return [condition[field]["fact"] for field in ("weight", "ige", "dose", "interval")]
    return [condition["input"]["fact"]]


def _unique(records, fields):
    indexed = {tuple(record.get(field, 0 if field == "page" else "") for field in fields): dict(record) for record in records}
    return [indexed[key] for key in sorted(indexed)]


def _source(citation, sources):
    document_id = citation["source_id"]
    source = sources[document_id]
    result = {"document_id": document_id, "locator": citation["locator"], "edition": source["edition"], "url": source["url"]}
    if "page" in citation:
        result["page"] = citation["page"]
    return result


def _finding(rule, status, premises, sources, facts, derived):
    citations = [_source(citation, sources) for citation in rule["sources"]]
    evidence = []
    missing = []
    for key in premises:
        if key in derived:
            evidence.extend(derived[key]["evidence"])
            citations.extend(derived[key]["source"])
        else:
            evidence.extend(facts.get(key, {}).get("evidence", ()))
            if _confirmed(facts, key) is None:
                missing.append(key)
    description = rule["conclusion"]["description"]
    label = status.replace("nao_", "não ")
    if status == "pendente" and missing:
        detail = ". Revisar evidência de " + ", ".join(missing)
    elif status == "pendente" and rule["condition"]["op"] != "aggregate":
        detail = ". Limiar ou combinação de evidências exige revisão humana"
    else:
        detail = ""
    return {
        "rule_id": rule["id"],
        "conclusion": f"{description}. Resultado {label}{detail}.",
        "premises": premises,
        "source": _unique(citations, ("document_id", "locator", "page")),
        "evidence": _unique(evidence, ("document_id", "page", "excerpt")),
        "status": status,
    }


def infer(facts, rules, config):
    """Encadeie conclusões para a frente e guarde a ordem real dos disparos."""
    limit = config.get("max_steps", len(rules["rules"]))
    if type(limit) is not int or limit < 1:
        raise ValueError("max_steps deve ser um inteiro positivo.")
    strategy = config.get("agenda_strategy", "prioridade")
    aggregation = config.get("aggregation", "violacao_primeiro")
    if strategy not in ("prioridade", "especificidade") or aggregation not in ("violacao_primeiro", "incerteza_primeiro"):
        raise ValueError("Configuração de inferência inválida.")
    agenda = [(rule, _premises(rule["condition"])) for rule in rules["rules"]]
    if strategy == "especificidade":
        agenda.sort(key=lambda item: (-len(item[1]), item[0]["id"]))
    else:
        agenda.sort(key=lambda item: (-item[0]["priority"], item[0]["id"]))
    derived = {}
    trace = []
    while agenda:
        for index, (rule, premises) in enumerate(agenda):
            condition = rule["condition"]
            if condition["op"] != "aggregate" or all(key in derived for key in premises):
                break
        else:
            raise RuntimeError("Agenda sem regra aplicável antes da conclusão documental.")
        if len(trace) >= limit:
            raise RuntimeError("Limite de disparos atingido antes do ponto fixo.")
        agenda.pop(index)
        result = _test_condition(condition, premises, facts, derived, aggregation)
        derived[rule["id"]] = _finding(rule, result, premises, rules["sources"], facts, derived)
        trace.append({"rule_id": rule["id"], "layer": rule["layer"], "depends_on": premises, "status": result})
    return {"findings": list(derived.values()), "trace": trace, "final": derived[rules["final_rule_id"]]}


def explain(case, inference):
    """Monte o relatório preservando o protocolo e a data da solicitação."""
    final = inference["final"]
    return {
        **{key: case[key] for key in (*PROFILE_KEYS, "reference_date")},
        "status": final["status"],
        "conclusion": final["conclusion"],
        "findings": inference["findings"],
        "trace": inference["trace"],
        "limitations": [LIMITATION, *sorted(set(case["warnings"]))],
    }


def analyze(facts, rules, config):
    """Valide, encadeie e explique um envelope de fatos."""
    validate_knowledge(rules)
    index = validate_case(facts, rules)
    scope = rules["scope"]
    premises = sorted(scope)
    values = {key: _confirmed(index, key) for key in premises}
    if values == scope:
        return explain(facts, infer(index, rules, config))
    outside = any(value is not None and value != scope[key] for key, value in values.items())
    status = "nao_aplicavel" if outside else "pendente"
    rule_id = rules["scope_rule_id"]
    conclusion = "Solicitação fora do recorte acadêmico." if outside else "Escopo documental ainda não confirmado."
    evidence = [entry for key in premises for entry in index.get(key, {}).get("evidence", ())]
    final = {
        "rule_id": rule_id, "status": status, "conclusion": conclusion,
        "premises": premises, "evidence": _unique(evidence, ("document_id", "page", "excerpt")), "source": [],
    }
    trace = [{"rule_id": rule_id, "layer": "documental", "depends_on": premises, "status": status}]
    return explain(facts, {"findings": [final], "trace": trace, "final": final})
