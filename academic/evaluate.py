"""Runner offline para medir a concordância com um gabarito fixado."""
import argparse
import csv
from datetime import date
from hashlib import sha256
import json
from pathlib import Path
from random import Random
from time import perf_counter_ns

from .baseline import VERSION, assess_checklist
from .contract import ENGINE_VERSION, analyze
from .knowledge import load_knowledge

FIXTURE = Path(__file__).parent / "fixtures" / "cases.json"
PROTOCOL = ("0.1.0", "asma-ceaf-sc-omalizumabe", "2026-09")
# O resumo estadual informa o mês de edição. O recorte usa datas posteriores a esse mês.
FIRST_REFERENCE_DATE = date(2026, 10, 1)
SUBSETS = ("desenvolvimento", "avaliacao", "todos")
STATUSES = ("conforme", "pendente", "nao_conforme", "nao_aplicavel")


def evaluate(
    fixture: Path, subset: str, *, knowledge: dict | None = None, engine_config: dict | None = None, seed: int | None = None,
) -> dict:
    raw_fixture = fixture.read_bytes()
    corpus = json.loads(raw_fixture)
    cases = corpus["cases"]
    identifiers = [item["case_id"] for item in cases]
    if len(identifiers) != len(set(identifiers)):
        raise ValueError("IDs de caso duplicados no gabarito.")
    rng = Random(seed) if seed is not None else None
    ordered_knowledge = knowledge
    if rng is not None:
        rng.shuffle(cases)
        if knowledge is not None:
            ordered_rules = list(knowledge["rules"])
            rng.shuffle(ordered_rules)
            ordered_knowledge = {**knowledge, "rules": ordered_rules}
    results = []
    configuration, version = ("checklist_fixo", VERSION) if knowledge is None else ("especialista", ENGINE_VERSION)
    for item in cases:
        if subset != "todos" and item["subset"] != subset:
            continue
        expected = item["expected"]
        if expected not in STATUSES:
            raise ValueError(f"Classe inválida no gabarito de {item['case_id']}.")
        audit = item.get("audit")
        if rng is not None and isinstance(audit, dict) and isinstance(audit.get("facts"), list):
            ordered_facts = list(audit["facts"])
            rng.shuffle(ordered_facts)
            audit = {**audit, "facts": ordered_facts}
        reference_date = audit.get("reference_date") if isinstance(audit, dict) else None
        start = perf_counter_ns()
        error = ""
        try:
            profile = (audit["schema_version"], audit["protocol_id"], audit["protocol_version"])
            if profile != PROTOCOL:
                raise ValueError("Versão ou protocolo incompatível.")
            if date.fromisoformat(reference_date) < FIRST_REFERENCE_DATE:
                raise ValueError("Data anterior ao recorte temporal do experimento.")
            if knowledge is None:
                actual, checks = assess_checklist(audit["facts"])
            else:
                config = {"max_steps": len(knowledge["rules"]), **(engine_config or {})}
                report = analyze(audit, ordered_knowledge, config)
                actual = report["status"]
                if actual not in STATUSES:
                    raise ValueError("Classe inválida no relatório do motor.")
                checks = {finding["rule_id"]: finding["status"] for finding in report["findings"]}
        except NotImplementedError:
            raise
        except (KeyError, TypeError, ValueError, AttributeError, RuntimeError) as exc:
            actual, checks, error = "erro", {}, str(exc)
        elapsed_ns = perf_counter_ns() - start
        results.append(
            {
                "case_id": item["case_id"],
                "subset": item["subset"],
                "esperado": expected,
                "obtido": actual,
                "acerto": expected == actual,
                "tempo_ns": elapsed_ns,
                "configuracao": configuration,
                "versao": version,
                "data_referencia": reference_date,
                "criterios": checks,
                "erro": error,
            }
        )

    if not results:
        raise ValueError(f"Conjunto sem casos: {subset}")
    correct = sum(row["acerto"] for row in results)
    by_class = {
        label: {
            "total": sum(row["esperado"] == label for row in results),
            "acertos": sum(row["esperado"] == label and row["acerto"] for row in results),
        }
        for label in STATUSES
    }
    report = {
        "metrica": "percentual_de_classes_finais_corretas",
        "configuracao": configuration,
        "versao": version,
        "schema_version": PROTOCOL[0],
        "protocol_id": PROTOCOL[1],
        "protocol_version": PROTOCOL[2],
        "fixture_version": corpus["fixture_version"],
        "fixture_sha256": sha256(raw_fixture).hexdigest(),
        "conjunto": subset,
        "total": len(results),
        "acertos": correct,
        "percentual": 100 * correct / len(results),
        "falsos_conformes": sum(
            row["obtido"] == "conforme" and row["esperado"] != "conforme" for row in results
        ),
        "por_classe": by_class,
        "casos": results,
    }
    if knowledge is not None:
        normalized = json.dumps(knowledge, sort_keys=True, ensure_ascii=False).encode("utf-8")
        report["knowledge_version"] = knowledge["knowledge_version"]
        report["knowledge_sha256"] = sha256(normalized).hexdigest()
    if seed is not None:
        report["seed"] = seed
    if engine_config is not None:
        report["engine_config"] = engine_config
    return report


def write_results(report: dict, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    method = "baseline" if report["configuracao"] == "checklist_fixo" else "especialista"
    stem = f"{method}-{report['conjunto']}"
    with (output_dir / f"{stem}.json").open("w", encoding="utf-8") as output:
        json.dump(report, output, ensure_ascii=False, indent=2)
        output.write("\n")
    rows = report["casos"]
    fields = list(rows[0])
    with (output_dir / f"{stem}.csv").open("w", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow(dict(row, criterios=json.dumps(row["criterios"], ensure_ascii=False)))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--conjunto", choices=SUBSETS, default="avaliacao")
    parser.add_argument("--casos", type=Path, default=FIXTURE)
    parser.add_argument("--saida", type=Path, required=True)
    parser.add_argument("--metodo", choices=("baseline", "especialista", "ambos"), default="baseline")
    args = parser.parse_args()
    reports = []
    try:
        if args.metodo in ("especialista", "ambos"):
            reports.append(evaluate(args.casos, args.conjunto, knowledge=load_knowledge()))
        if args.metodo in ("baseline", "ambos"):
            reports.append(evaluate(args.casos, args.conjunto))
    except NotImplementedError as exc:
        parser.exit(2, f"Motor de inferência indisponível. {exc}\n")
    for report in reports:
        write_results(report, args.saida)
        print(
            f"{report['configuracao']} ({report['conjunto']}): "
            f"{report['acertos']}/{report['total']} = {report['percentual']:.2f}%"
        )
        print(f"SHA-256 dos casos: {report['fixture_sha256']}")
    return int(any(row["erro"] for report in reports for row in report["casos"]))


if __name__ == "__main__":
    raise SystemExit(main())
