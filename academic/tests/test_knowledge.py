from copy import deepcopy
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from academic.knowledge import DEFAULT_KNOWLEDGE, load_knowledge, validate_knowledge


class KnowledgeTests(unittest.TestCase):
    def setUp(self):
        self.base = load_knowledge()
        self.rules = {rule["id"]: rule for rule in self.base["rules"]}

    def test_cited_rules_and_layers(self):
        leaves = [rule for rule in self.rules.values() if rule["condition"]["op"] != "aggregate"]
        self.assertEqual(len(leaves), 21)
        self.assertTrue(all(rule["sources"] for rule in leaves))
        final = self.rules["R24"]
        self.assertEqual(final["condition"]["inputs"], [{"rule": "R22"}, {"rule": "R23"}])
        self.assertEqual(final["layer"], "documental")
        self.assertTrue(all(self.rules[key]["layer"] == "intermediaria" for key in ("R22", "R23")))

    def test_saved_sources_exist(self):
        repo = DEFAULT_KNOWLEDGE.parents[2]
        for source in self.base["sources"].values():
            if "file" in source:
                self.assertTrue((repo / source["file"]).is_file(), source["file"])

    def test_unknown_fact(self):
        self.rules["A01"]["condition"]["input"] = {"fact": "inventado"}
        with self.assertRaisesRegex(ValueError, "referência inválida"):
            validate_knowledge(self.base)

    def test_unit_mismatch(self):
        self.base["facts"]["peso"]["unit"] = "g"
        with self.assertRaisesRegex(ValueError, "unidade incompatível"):
            validate_knowledge(self.base)

    def test_unregistered_source(self):
        self.rules["C01"]["sources"][0]["source_id"] = "OUTRA"
        with self.assertRaisesRegex(ValueError, "fonte desconhecida"):
            validate_knowledge(self.base)

    def test_duplicate_rule_and_duplicate_condition(self):
        duplicate = deepcopy(self.rules["A01"])
        self.base["rules"].append(duplicate)
        with self.assertRaisesRegex(ValueError, "duplicado"):
            validate_knowledge(self.base)
        duplicate["id"] = duplicate["conclusion"]["key"] = "A10"
        with self.assertRaisesRegex(ValueError, "condição de regra duplicada"):
            validate_knowledge(self.base)

    def test_cycle_and_unknown_dependency(self):
        self.rules["R22"]["condition"]["inputs"][0]["rule"] = "R24"
        with self.assertRaisesRegex(ValueError, "Ciclo"):
            validate_knowledge(self.base)
        self.rules["R22"]["condition"]["inputs"][0]["rule"] = "A99"
        with self.assertRaisesRegex(ValueError, "referência inválida"):
            validate_knowledge(self.base)

    def test_orphan_rule(self):
        self.rules["R22"]["condition"]["inputs"].pop()
        with self.assertRaisesRegex(ValueError, "sem caminho"):
            validate_knowledge(self.base)

    def test_duplicated_json_key(self):
        with TemporaryDirectory() as tmp:
            path = Path(tmp) / "base.json"
            path.write_text('{"rules": [], "rules": []}', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Chave JSON duplicada"):
                load_knowledge(path)
