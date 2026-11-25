
import unittest

from importlib.util import spec_from_file_location, module_from_spec
from pathlib import Path

engine_path = Path(__file__).with_name("context-engine-v1.1.py")

spec = spec_from_file_location("context_engine", engine_path)
engine = module_from_spec(spec)
spec.loader.exec_module(engine)


class TestContextEngine(unittest.TestCase):

    def check_context(self, data, expected):
        result = engine.analyse_context(data)
        self.assertEqual(result["context"], expected)
        self.assertTrue(result["keep_alert"])

    def test_duplicate_detected(self):
        self.check_context(
            {"duplicate_detected": True},
            "duplicate_detected"
        )

    def test_suspicious_history(self):
        self.check_context(
            {
                "suspicious_feedback_count": 2,
                "history_months": 6
            },
            "suspicious_history"
        )

    def test_recurring_pattern(self):
        self.check_context(
            {
                "recurring_pattern_count": 3,
                "history_months": 6
            },
            "recurring_pattern"
        )

    def test_behavior_change(self):
        self.check_context(
            {
                "behavior_change_reported": True,
                "expected_feedback_count": 2,
                "history_months": 6
            },
            "possible_behavior_change"
        )

    def test_insufficient_history(self):
        self.check_context(
            {"history_months": 2},
            "insufficient_context"
        )

    def test_no_supporting_context(self):
        self.check_context(
            {"history_months": 6},
            "no_supporting_context"
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
