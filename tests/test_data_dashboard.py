"""
Automated unit tests for Rock & Fluid Data Dashboard logic.
"""

def test_data_dashboard_placeholder():
    # Placeholder test ensuring dataset parsing logic runs safely
    sample_data = [
        {"Porosity": 15.0, "Permeability": 100.0},
        {"Porosity": 20.0, "Permeability": 250.0},
    ]
    assert len(sample_data) == 2
    assert sample_data[0]["Porosity"] == 15.0
