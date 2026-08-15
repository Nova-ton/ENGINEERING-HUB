"""
Unit tests for Rock & Fluid Data Analytics helper functions.
"""

import unittest
from engineering import RockFluidAnalyzer


class TestDataDashboard(unittest.TestCase):
    """Tests for statistical analysis and data handling."""

    def test_summary_statistics_calculation(self):
        sample_vals = [10.0, 20.0, 30.0, 40.0, 50.0]
        stats = RockFluidAnalyzer.compute_column_statistics(sample_vals, "Porosity")

        self.assertEqual(stats["count"], 5)
        self.assertAlmostEqual(stats["mean"], 30.0, places=3)
        self.assertAlmostEqual(stats["min"], 10.0, places=3)
        self.assertAlmostEqual(stats["median"], 30.0, places=3)
        self.assertAlmostEqual(stats["max"], 50.0, places=3)

    def test_empty_or_nan_values(self):
        empty_stats = RockFluidAnalyzer.compute_column_statistics([], "EmptyCol")
        self.assertEqual(empty_stats["count"], 0)
        self.assertEqual(empty_stats["mean"], 0.0)


if __name__ == "__main__":
    unittest.main()
