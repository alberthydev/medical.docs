import csv
from copy import deepcopy
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from academic.baseline import assess_checklist, checklist_baseline
from academic.dose_table import IGE_UPPER_IU_ML, TABLE, WEIGHT_UPPER_KG, lookup_dose
from academic.evaluate import FIXTURE, evaluate, write_results


CORPUS = json.loads(FIXTURE.read_text(encoding="utf-8"))
CASES = {case["case_id"]: case for case in CORPUS["cases"]}


class ChecklistTests(unittest.TestCase):
    def test_complete_dossier_consults_every_criterion(self):
        status, checks = assess_checklist(CASES["T01"]["audit"]["facts"])
        self.assertEqual(status, "conforme")
        self.assertEqual(len(checks), 21)
        self.assertTrue(all(value == "conforme" for value in checks.values()))

    def test_missing_and_explicit_negative_remain_distinct(self):
        self.assertEqual(checklist_baseline(CASES["T02"]["audit"]["facts"]), "pendente")
        self.assertEqual(checklist_baseline(CASES["T03"]["audit"]["facts"]), "nao_conforme")

    def test_confirmed_fact_without_evidence_is_pending(self):
        facts = deepcopy(CASES["T01"]["audit"]["facts"])
        for fact in facts:
            if fact["key"] == "cns_presente":
                fact["evidence"] = []
        self.assertEqual(checklist_baseline(facts), "pendente")

    def test_conflict_affects_dependent_checks(self):
        status, checks = assess_checklist(CASES["T09"]["audit"]["facts"])
        self.assertEqual((status, checks["C08"], checks["C12"]), ("pendente",) * 3)

    def test_human_review_at_exact_age(self):
        status, checks = assess_checklist(CASES["T05"]["audit"]["facts"])
        self.assertEqual((status, checks["C04"]), ("pendente", "pendente"))

    def test_documented_exam_impossibility(self):
        status, checks = assess_checklist(CASES["T11"]["audit"]["facts"])
        self.assertEqual((status, checks["A09"]), ("conforme", "nao_aplicavel"))

    def test_independent_violation_prevails_over_missing_fact(self):
        status, checks = assess_checklist(CASES["T18"]["audit"]["facts"])
        self.assertEqual((status, checks["A03"], checks["C11"]), ("nao_conforme", "pendente", "nao_conforme"))

    def test_known_renewal_does_not_enter_checklist(self):
        self.assertEqual(
            assess_checklist(CASES["T12"]["audit"]["facts"]),
            ("nao_aplicavel", {"escopo": "nao_aplicavel"}),
        )

    def test_duplicate_fact_is_invalid(self):
        facts = CASES["T01"]["audit"]["facts"]
        with self.assertRaisesRegex(ValueError, "duplicada"):
            checklist_baseline([*facts, facts[0]])


class DoseTableTests(unittest.TestCase):
    def test_every_column_and_row_is_present(self):
        self.assertEqual(len(TABLE), len(IGE_UPPER_IU_ML))
        self.assertTrue(all(len(row) == len(WEIGHT_UPPER_KG) for row in TABLE))

    def test_lower_bounds_and_four_week_cell(self):
        self.assertEqual(lookup_dose(20, 30), (75, 4))
        self.assertEqual(lookup_dose(70, 200), (300, 4))
        self.assertIsNone(lookup_dose(19.99, 30))

    def test_two_week_cells_and_prohibited_cell(self):
        self.assertEqual(lookup_dose(27, 650), (225, 2))
        self.assertEqual(lookup_dose(150, 300), (375, 2))
        self.assertIsNone(lookup_dose(150, 600))


class RunnerTests(unittest.TestCase):
    def test_split_and_metrical_denominator(self):
        report = evaluate(FIXTURE, "avaliacao")
        evaluation_cases = {case["case_id"] for case in CORPUS["cases"] if case["subset"] == "avaliacao"}
        self.assertEqual({row["case_id"] for row in report["casos"]}, evaluation_cases)
        self.assertEqual(report["total"], len(evaluation_cases))
        self.assertEqual(report["percentual"], 100 * report["acertos"] / report["total"])

    def test_incompatible_temporal_profile_counts_as_error(self):
        item = deepcopy(CASES["T01"])
        item["audit"]["reference_date"] = "2026-09-12"
        corpus = dict(CORPUS, cases=[item])
        with TemporaryDirectory() as temp:
            path = Path(temp) / "cases.json"
            path.write_text(json.dumps(corpus), encoding="utf-8")
            report = evaluate(path, "todos")
        self.assertEqual((report["total"], report["acertos"], report["percentual"]), (1, 0, 0))
        self.assertEqual(report["casos"][0]["obtido"], "erro")

    def test_csv_and_json_keep_the_same_results(self):
        report = evaluate(FIXTURE, "todos")
        with TemporaryDirectory() as temp:
            path = Path(temp)
            write_results(report, path)
            saved = json.loads((path / "baseline-todos.json").read_text(encoding="utf-8"))
            with (path / "baseline-todos.csv").open(encoding="utf-8", newline="") as csv_file:
                rows = list(csv.DictReader(csv_file))
        self.assertEqual(saved, report)
        self.assertEqual([(row["case_id"], row["obtido"]) for row in rows], [
            (row["case_id"], row["obtido"]) for row in report["casos"]
        ])
