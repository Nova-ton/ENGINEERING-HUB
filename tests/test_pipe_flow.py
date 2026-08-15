"""
Unit tests for Pipe Flow calculation engine.
"""

import unittest
import math
from engineering import Fluid, Pipe, PRESET_FLUIDS


class TestPipeFlow(unittest.TestCase):
    """Tests for Fluid and Pipe engineering classes."""

    def test_fluid_properties(self):
        fluid = Fluid("Water", 998.2, 0.001002)
        self.assertEqual(fluid.name, "Water")
        self.assertEqual(fluid.density, 998.2)
        self.assertEqual(fluid.dynamic_viscosity, 0.001002)
        self.assertAlmostEqual(fluid.kinematic_viscosity, 0.001002 / 998.2, places=6)

    def test_fluid_validation(self):
        with self.assertRaises(ValueError):
            Fluid("Invalid", -10, 0.001)
        with self.assertRaises(ValueError):
            Fluid("Invalid", 1000, 0)

    def test_pipe_hand_calculated_benchmark(self):
        # Water in Commercial Steel pipe: D=0.1 m, L=100 m, roughness=0.000045 m, Q=0.02 m^3/s
        fluid = Fluid("Water", 998.2, 0.001002)
        pipe = Pipe(0.1, 100.0, 0.000045)
        res = pipe.analyze_flow(fluid, 0.02)

        self.assertAlmostEqual(res["area"], 0.007854, places=5)
        self.assertAlmostEqual(res["velocity"], 2.5465, places=3)
        self.assertAlmostEqual(res["reynolds_number"], 253683, delta=500)
        self.assertEqual(res["regime"], "Turbulent")
        self.assertAlmostEqual(res["friction_factor"], 0.01815, delta=0.0005)
        self.assertAlmostEqual(res["pressure_drop_kpa"], 58.74, delta=1.0)

    def test_laminar_flow_case(self):
        fluid = Fluid("Heavy Oil", 900.0, 0.25)
        pipe = Pipe(0.05, 50.0, 0.00001)
        res = pipe.analyze_flow(fluid, 0.0005)

        self.assertEqual(res["regime"], "Laminar")
        expected_f = 64.0 / res["reynolds_number"]
        self.assertAlmostEqual(res["friction_factor"], expected_f, places=5)

    def test_zero_flow_rate(self):
        fluid = Fluid("Water", 998.2, 0.001002)
        pipe = Pipe(0.1, 100.0, 0.000045)
        res = pipe.analyze_flow(fluid, 0.0)

        self.assertEqual(res["velocity"], 0.0)
        self.assertEqual(res["reynolds_number"], 0.0)
        self.assertEqual(res["pressure_drop_kpa"], 0.0)

    def test_invalid_pipe_geometry(self):
        with self.assertRaises(ValueError):
            Pipe(0, 10, 0.0001)
        with self.assertRaises(ValueError):
            Pipe(0.1, -5, 0.0001)
        with self.assertRaises(ValueError):
            Pipe(0.1, 10, 0.15)  # roughness > diameter


if __name__ == "__main__":
    unittest.main()
