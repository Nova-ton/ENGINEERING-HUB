"""
Automated unit tests for Heat Transfer calculations.
"""

import pytest
import math
from engineering import HeatTransferCalculator


def test_conduction_verification_case():
    res = HeatTransferCalculator.calculate_conduction(
        thickness=0.2, area=10.0, thermal_conductivity=1.4, t_hot=100.0, t_cold=20.0
    )
    assert res["heat_transfer_rate_w"] == 5600.0
    assert res["heat_transfer_rate_kw"] == 5.6
    assert res["heat_flux_w_m2"] == 560.0


def test_conduction_invalid_inputs():
    with pytest.raises(ValueError):
        HeatTransferCalculator.calculate_conduction(0, 10, 1.4, 100, 20)

    with pytest.raises(ValueError):
        HeatTransferCalculator.calculate_conduction(0.2, 0, 1.4, 100, 20)

    with pytest.raises(ValueError):
        HeatTransferCalculator.calculate_conduction(0.2, 10, -1, 100, 20)


def test_newton_cooling_verification_case():
    res = HeatTransferCalculator.calculate_cooling(
        t_initial=90.0, t_ambient=20.0, t_target=50.0, cooling_constant=0.05
    )
    assert res["is_achievable"] is True
    assert math.isclose(res["time_min"], 16.946, rel_tol=1e-3)


def test_unachievable_target_temp():
    res = HeatTransferCalculator.calculate_cooling(
        t_initial=90.0, t_ambient=20.0, t_target=10.0, cooling_constant=0.05
    )
    assert res["is_achievable"] is False
    assert math.isnan(res["time_min"])
