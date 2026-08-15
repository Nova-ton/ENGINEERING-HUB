"""
Unit tests for Heat Transfer calculation engine.
"""

import unittest
import math
from engineering import HeatTransferCalculator


class TestHeatTransfer(unittest.TestCase):
    """Tests for steady-state conduction and Newton's Law of Cooling."""

    def test_conduction_benchmark(self):
        # Concrete wall: L = 0.2 m, A = 10 m^2, k = 1.4 W/mK, Thot = 100°C, Tcold = 20°C
        res = HeatTransferCalculator.calculate_conduction(
            thickness=0.2, area=10.0, thermal_conductivity=1.4, t_hot=100.0, t_cold=20.0
        )
        self.assertAlmostEqual(res["heat_transfer_rate_w"], 5600.0, places=2)
        self.assertAlmostEqual(res["heat_transfer_rate_kw"], 5.60, places=3)
        self.assertAlmostEqual(res["heat_flux_w_m2"], 560.0, places=2)
        self.assertAlmostEqual(res["delta_t"], 80.0, places=2)
        self.assertAlmostEqual(res["temperature_gradient"], 400.0, places=2)

    def test_conduction_validation(self):
        with self.assertRaises(ValueError):
            HeatTransferCalculator.calculate_conduction(0, 10, 1.4, 100, 20)
        with self.assertRaises(ValueError):
            HeatTransferCalculator.calculate_conduction(0.2, 0, 1.4, 100, 20)
        with self.assertRaises(ValueError):
            HeatTransferCalculator.calculate_conduction(0.2, 10, 0, 100, 20)

    def test_newton_cooling_benchmark(self):
        # T0 = 90°C, Tamb = 20°C, Ttarget = 50°C, k = 0.05 1/min
        res = HeatTransferCalculator.calculate_cooling(
            t_initial=90.0, t_ambient=20.0, t_target=50.0, cooling_constant=0.05
        )
        self.assertTrue(res["is_achievable"])
        self.assertTrue(res["is_cooling"])
        self.assertAlmostEqual(res["time_min"], 16.946, places=2)

    def test_newton_cooling_unachievable_cases(self):
        # Cooling case: Target higher than initial
        res1 = HeatTransferCalculator.calculate_cooling(
            t_initial=80.0, t_ambient=20.0, t_target=90.0, cooling_constant=0.05
        )
        self.assertFalse(res1["is_achievable"])
        self.assertTrue(math.isnan(res1["time_min"]))

        # Cooling case: Target below ambient
        res2 = HeatTransferCalculator.calculate_cooling(
            t_initial=80.0, t_ambient=20.0, t_target=10.0, cooling_constant=0.05
        )
        self.assertFalse(res2["is_achievable"])

    def test_newton_cooling_heating_mode(self):
        # Cold beverage warming up in warm room: T0 = 5°C, Tamb = 25°C, Ttarget = 18°C
        res = HeatTransferCalculator.calculate_cooling(
            t_initial=5.0, t_ambient=25.0, t_target=18.0, cooling_constant=0.04
        )
        self.assertTrue(res["is_achievable"])
        self.assertFalse(res["is_cooling"])
        expected_time = -math.log((18 - 25) / (5 - 25)) / 0.04
        self.assertAlmostEqual(res["time_min"], expected_time, places=3)


if __name__ == "__main__":
    unittest.main()
