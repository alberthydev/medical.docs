"""Experimentos offline pré-registrados do Medical Docs."""
import argparse
import csv
from hashlib import sha256
import json
from pathlib import Path
from statistics import mean, pstdev

from .contract import analyze
from .evaluate import FIXTURE, evaluate
from .knowledge import load_knowledge

PLAN = Path(__file__).parent / "fixtures" / "experiment-plan.json"


def run(plan_path, fixture, output):
    raw_plan = plan_path.read_bytes()
    plan = json.loads(raw_plan)
    raw_cases = fixture.read_bytes()
    if sha256(raw_cases).hexdigest() != plan["fixture_sha256"]:
        raise ValueError("Os casos diferem do gabarito pré-registrado.")
    cases = json.loads(raw_cases)["cases"]
    if any(case["audit"]["reference_date"] != plan["reference_date"] for case in cases):
        raise ValueError("A data de referência diverge do plano.")
    knowledge = load_knowledge()
    repetitions = []
    summary = []
    for config in plan["configurations"]:
        parameters = {key: value for key, value in config.items() if key != "label"}
        for subset in plan["subsets"]:
            runs = []
            for seed in plan["seeds"]:
                result = evaluate(fixture, subset, seed=seed, knowledge=knowledge if parameters else None,
                                  engine_config=parameters or None)
                if any(row["erro"] for row in result["casos"]):
                    raise RuntimeError("Uma configuração não executou todos os casos.")
                cases_run = sorted(
                    ({k: row[k] for k in ("case_id", "esperado", "obtido", "acerto", "tempo_ns")}
                     for row in result["casos"]), key=lambda row: row["case_id"],
                )
                runs.append({
                    "configuracao": config["label"], "modo": parameters or None, "conjunto": subset, "semente": seed,
                    "versao": result["versao"],
                    "total": result["total"], "acertos": result["acertos"], "percentual": result["percentual"],
                    "falsos_conformes": result["falsos_conformes"],
                    "tempo_ms_medio_por_caso": mean(row["tempo_ns"] for row in cases_run) / 1_000_000,
                    "erros": [row["case_id"] for row in cases_run if not row["acerto"]], "casos": cases_run,
                })
            vectors = [tuple(row["obtido"] for row in run["casos"]) for run in runs]
            summary.append({
                "configuracao": config["label"], "conjunto": subset, "repeticoes": len(runs),
                "media_percentual": mean(item["percentual"] for item in runs),
                "desvio_percentual": pstdev(item["percentual"] for item in runs),
                "variacao_por_semente": len(set(vectors)) > 1,
                "media_ms_por_caso": mean(item["tempo_ms_medio_por_caso"] for item in runs),
                "falsos_conformes_total": sum(item["falsos_conformes"] for item in runs),
                "erros_distintos": sorted({case for item in runs for case in item["erros"]}),
            })
            repetitions.extend(runs)
    audit = next(case["audit"] for case in cases if case["case_id"] == "T01")
    order = {
        strategy: [step["rule_id"] for step in analyze(audit, knowledge, {"agenda_strategy": strategy})["trace"]]
        for strategy in ("prioridade", "especificidade")
    }
    report = {
        "plan_sha256": sha256(raw_plan).hexdigest(), "fixture_sha256": plan["fixture_sha256"],
        "reference_date": plan["reference_date"], "metric": plan["primary_metric"],
        "knowledge_sha256": sha256(json.dumps(knowledge, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest(),
        "summary": summary, "repetitions": repetitions, "traces_T01": order,
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / "medicoes.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    fields = [key for key in repetitions[0] if key not in ("casos", "modo")]
    with (output / "repeticoes.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for run in repetitions:
            writer.writerow({**{key: run[key] for key in fields}, "erros": ",".join(run["erros"])})
    return report


def plot(report, output):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(1, 2, sharey=True, figsize=(11.6, 4), facecolor="white")
    for ax, subset, title in zip(axes, ("avaliacao", "desenvolvimento"), ("Avaliação • 13 casos", "Desenvolvimento • 8 casos")):
        rows = [row for row in report["summary"] if row["conjunto"] == subset]
        values = [row["media_percentual"] for row in rows]
        bars = ax.barh(range(len(rows)), values, color=["#64748b", "#0e7490", "#0e7490", "#c2672e", "#c2672e"], height=0.58)
        ax.set_yticks(range(len(rows)), [row["configuracao"] for row in rows])
        ax.set_xlim(0, 111)
        ax.set_xticks([0, 25, 50, 75, 100])
        ax.set_title(title, loc="left", fontweight="bold")
        ax.set_xlabel("Casos corretos (%)")
        ax.grid(axis="x", color="#e2e8f0")
        ax.set_axisbelow(True)
        ax.bar_label(bars, labels=[f"{value:g}%" for value in values], padding=3, fontsize=9)
        for spine in ax.spines.values():
            spine.set_visible(False)
    axes[0].invert_yaxis()
    fig.suptitle("Concordância com o gabarito sintético", x=0.055, ha="left", fontsize=16, fontweight="bold")
    fig.tight_layout()
    fig.savefig(output / "concordancia.png", dpi=170, facecolor="white", bbox_inches="tight")
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plano", type=Path, default=PLAN)
    parser.add_argument("--casos", type=Path, default=FIXTURE)
    parser.add_argument("--saida", type=Path, required=True)
    parser.add_argument("--grafico", action="store_true")
    args = parser.parse_args()
    report = run(args.plano, args.casos, args.saida)
    if args.grafico:
        plot(report, args.saida)
    for row in report["summary"]:
        print(f"{row['conjunto']} | {row['configuracao']} | {row['media_percentual']:.2f}% | erros {row['erros_distintos']}")
    print(f"{len(report['repetitions'])} execuções, plano {report['plan_sha256']}")


if __name__ == "__main__":
    main()
