"""
Unit tests for Independent Hand-Calculation Verification Suite.
"""

import unittest
from engineering import VerificationEngine


class TestVerificationSuite(unittest.TestCase):
    """Tests for verification engine benchmark evaluations."""

    def test_all_benchmarks_pass(self):
        summary = VerificationEngine.run_all_tests()
        self.assertEqual(summary["total_tests"], 3)
        self.assertEqual(summary["passed_tests"], 3)
        self.assertTrue(summary["all_passed"])

    def test_individual_case_details(self):
        cases = VerificationEngine.get_test_cases()
        for case in cases:
            self.assertTrue(case["passed"], f"Test case {case['id']} failed.")
            self.assertGreater(len(case["handCalculationSteps"]), 0)


if __name__ == "__main__":
    unittest.main()
