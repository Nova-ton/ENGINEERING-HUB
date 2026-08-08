"""
Automated unit tests for Pipe Flow calculations.
"""

import pytest
import math
from engineering import Fluid, Pipe


def test_fluid_initialization():
    f = Fluid("Water", 998.2, 0.001002)
    assert f.density == 998.2
    assert f.dynamic_viscosity == 0.001002
    assert math.isclose(f.kinematic_viscosity, 0.001002 / 998.2, rel_tol=1e-5)

    with pytest.raises(ValueError):
        Fluid("Invalid", -10, 0.001)

    with pytest.raises(ValueError):
        Fluid("Invalid", 1000, 0)


def test_pipe_hand_calculated_case():
    # Verification case: Water flow in steel pipe
    # D = 0.1 m, L = 100 m, Roughness = 0.000045 m, Q = 0.02 m^3/s
    fluid = Fluid("Water", 998.2, 0.001002)
    pipe = Pipe(0.1, 100, 0.000045)
    res = pipe.analyze_flow(fluid, 0.02)

    assert math.isclose(res["area"], 0.00785398, rel_tol=1e-4)
    assert math.isclose(res["velocity"], 2.54648, rel_tol=1e-4)
    assert math.isclose(res["reynolds_number"], 253683, rel_tol=1e-3)
    assert res["regime"] == "Turbulent"
    assert math.isclose(res["friction_factor"], 0.01815, rel_tol=2e-2)
    assert math.isclose(res["pressure_drop_kpa"], 58.74, rel_tol=2e-2)


def test_laminar_flow():
    fluid = Fluid("Heavy Oil", 900, 0.25)
    pipe = Pipe(0.05, 50, 0.00001)
    res = pipe.analyze_flow(fluid, 0.0005)

    assert res["regime"] == "Laminar"
    expected_f = 64.0 / res["reynolds_number"]
    assert math.isclose(res["friction_factor"], expected_f, rel_tol=1e-5)


def test_invalid_pipe_inputs():
    with pytest.raises(ValueError):
        Pipe(0, 10, 0.001)

    with pytest.raises(ValueError):
        Pipe(0.1, -5, 0.001)

    with pytest.raises(ValueError):
        Pipe(0.1, 10, 0.2)  # Roughness > Diameter
