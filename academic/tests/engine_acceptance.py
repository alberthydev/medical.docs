"""Aceite da fase 03. Execute após implementar academic.contract.analyze."""
from copy import deepcopy
import json
import unittest

from academic.contract import analyze
from academic.evaluate import FIXTURE, evaluate
from academic.knowledge import load_knowledge


CASES = {case["case_id"]: case["audit"] for case in json.loads(FIXTURE.read_text(encoding="utf-8"))["cases"]}


class EngineAcceptance(unittest.TestCase):
    def setUp(self):
        self.rules = load_knowledge()
        self.config = {"max_steps": len(self.rules["rules"])}

    def analyze_case(self, case_id):
        return analyze(deepcopy(CASES[case_id]), self.rules, self.config)

    def test_dataset_uses_same_validated_cases_as_baseline(self):
        baseline = evaluate(FIXTURE, "todos")
        expert = evaluate(FIXTURE, "todos", knowledge=self.rules)
        self.assertEqual(expert["fixture_sha256"], baseline["fixture_sha256"])
        self.assertEqual(expert["total"], baseline["total"])
        failures = [row["case_id"] for row in expert["casos"] if not row["acerto"]]
        self.assertEqual(failures, [])

    def test_real_chaining_and_evidence(self):
        report = self.analyze_case("T01")
        self.assertEqual(report["status"], "conforme")
        trace = report["trace"]
        positions = {step["rule_id"]: n for n, step in enumerate(trace)}
        self.assertEqual(len(positions), len(trace))
        steps = {step["rule_id"]: step for step in trace}
        self.assertIn("A01", steps["R22"]["depends_on"])
        self.assertIn("R22", steps["R24"]["depends_on"])
        self.assertIn("R23", steps["R24"]["depends_on"])
        self.assertLess(positions["A01"], positions["R22"])
        self.assertLess(positions["R22"], positions["R24"])
        self.assertEqual(steps["R24"]["layer"], "documental")

        finding = next(row for row in report["findings"] if row["rule_id"] == "A01")
        self.assertEqual(finding["status"], "conforme")
        self.assertIn("cns_presente", finding["premises"])
        self.assertTrue(any(source["document_id"] == "MS2" for source in finding["source"]))
        self.assertTrue(any(evidence["document_id"] == "D01" for evidence in finding["evidence"]))
        self.assertTrue(report["limitations"])

    def test_facts_and_rules_order_and_repeated_execution(self):
        case = deepcopy(CASES["T01"])
        rules = deepcopy(self.rules)
        first = analyze(case, rules, self.config)
        self.assertEqual(case, CASES["T01"])
        self.assertEqual(rules, self.rules)
        self.assertEqual(first, analyze(case, rules, self.config))
        case["facts"].reverse()
        rules["rules"].reverse()
        self.assertEqual(first, analyze(case, rules, self.config))

    def test_agenda_uses_priority_and_stable_ids(self):
        rules = deepcopy(self.rules)
        identity = next(rule for rule in rules["rules"] if rule["id"] == "A02")
        identity["priority"] = 110
        report = analyze(deepcopy(CASES["T01"]), rules, self.config)
        self.assertEqual([step["rule_id"] for step in report["trace"][:3]], ["A02", "A01", "A03"])

    def test_absence_conflict_and_exclusion(self):
        for case_id, status, rule_id in (
            ("T02", "pendente", "A03"),
            ("T05", "pendente", "C04"),
            ("T09", "pendente", "C08"),
            ("T13", "nao_conforme", "C10"),
            ("T15", "nao_conforme", "C12"),
        ):
            with self.subTest(case_id=case_id):
                report = self.analyze_case(case_id)
                self.assertEqual(report["status"], status)
                finding = next(row for row in report["findings"] if row["rule_id"] == rule_id)
                self.assertEqual(finding["status"], status)
                self.assertTrue(finding["conclusion"])

    def test_scope_shortcut_and_reference_date(self):
        report = self.analyze_case("T12")
        self.assertEqual(report["status"], "nao_aplicavel")
        self.assertEqual(report["reference_date"], CASES["T12"]["reference_date"])
        self.assertEqual([step["rule_id"] for step in report["trace"]], ["ESCOPO"])

    def test_defensive_limit_and_cycle_error(self):
        with self.assertRaises((ValueError, RuntimeError)):
            try:
                analyze(CASES["T01"], self.rules, {"max_steps": 1})
            except NotImplementedError as exc:
                self.fail(str(exc))
        rules = deepcopy(self.rules)
        admin = next(rule for rule in rules["rules"] if rule["id"] == "R22")
        admin["condition"]["inputs"][0]["rule"] = "R24"
        with self.assertRaisesRegex(ValueError, "(?i)ciclo"):
            analyze(CASES["T01"], rules, self.config)


if __name__ == "__main__":
    unittest.main()
