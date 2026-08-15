# ⚙️ ENGINEERING HUB

A comprehensive, interactive multi-disciplinary engineering calculation and data analytics suite built with **Streamlit** and pure **Object-Oriented Python**.

Designed for petroleum, chemical, mechanical, and civil engineers, **ENGINEERING HUB** combines hydrodynamic modeling, thermal engineering, petrophysical and PVT data exploration, and an independent hand-calculation verification suite.

---

## 🚀 Live Streamlit Community Cloud Deployment

This repository is structured for immediate 1-click deployment on [Streamlit Community Cloud](https://streamlit.io/cloud):

1. Push this repository to GitHub.
2. Log into **Streamlit Community Cloud**.
3. Select your repository, set the Main file path to `app.py`, and click **Deploy**!

---

## 📦 Core Engineering Modules

### 1. 🌊 Pipe Flow Analyser
- **Darcy-Weisbach Formulation**: Evaluates circular pipe hydraulics, friction head loss, and pressure drops across metric and field units (Pa, kPa, bar, psi).
- **Colebrook-White Newton-Raphson Solver**: Solves the implicit friction factor equation iteratively to $10^{-8}$ tolerance.
- **Explicit Equation Comparison**: Real-time cross-validation against Haaland (1983) and Swamee-Jain (1976) approximations.
- **Interactive System Curve**: Dynamically generates $\Delta P$ vs. Flow Rate curves with active operating point markers.

### 2. 🔥 Heat Transfer Calculator
- **1D Plane Wall Conduction**: Implements Fourier's Law with built-in thermal conductivity libraries (Metals, Building Materials, Insulators) to compute heat rates, heat fluxes, and thermal resistance.
- **Spatial Temperature Profile**: Visualizes linear temperature distribution $T(x)$ across wall cross-sections.
- **Newton's Law of Cooling**: Solves transient lumped-system thermal decay with exact logarithmic time-to-target solutions and physical feasibility checks.
- **Transient Cooling Curve**: Interactive $T(t)$ exponential response curves with ambient asymptotes and target thresholds.

### 3. 📊 Rock & Fluid Data Dashboard
- **Petrophysical Core Analysis**: Preset analysis of 50 core plug samples (Porosity, Permeability, Bulk/Grain Density, Water Saturation, Facies).
- **PVT Laboratory Data**: Preset Black Oil laboratory test dataset (Pressure, $B_o$, $R_s$, $\mu_o$, $B_g$).
- **Custom CSV File Upload**: Ingest and explore any proprietary CSV tabular dataset.
- **Interactive Multi-Variable Filters**: Dynamic numeric range sliders and categorical multi-select filters.
- **Statistical Moments**: Automatic 5-number summary (Count, Mean, Std Dev, Min, 25%, Median, 75%, Max).
- **Visual Analytics**: Property distribution histograms with boxplot marginals, semi-log crossplots, and Pearson correlation heatmaps.

### 4. ✅ Independent Hand-Calculation Verification Suite
- **Textbook Quality Assurance**: 3 benchmark verification test cases mathematically verified against manual derivations within strict tolerances ($\le 0.5\% - 2.0\%$).
- **Step-by-Step Derivations**: Transparent mathematical proofs and hand-calculation steps for every formula.

---

## 🛠️ Local Installation & Execution

### Prerequisites
- Python 3.10+
- pip

### 1. Clone the repository
```bash
git clone https://github.com/your-username/engineering-hub.git
cd engineering-hub
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Streamlit application
```bash
streamlit run app.py
```
Open your browser at `http://localhost:8501`.

---

## 🧪 Running the Unit Tests

Execute the automated test suite with standard `unittest` or `pytest`:

```bash
# Using Python's built-in unittest
python -m unittest discover tests

# Using pytest
pytest
```

---

## 📁 Repository File Structure

```text
ENGINEERING-HUB/
├── app.py                      # Main interactive Streamlit application
├── engineering.py              # Object-oriented engineering classes & solvers
├── requirements.txt            # Python dependencies for Streamlit Cloud
├── README.md                   # Documentation & deployment guide
├── data/
│   ├── core_data.csv           # Preset petrophysical core plug dataset
│   └── pvt_data.csv            # Preset black oil PVT laboratory dataset
└── tests/
    ├── test_pipe_flow.py       # Hydraulics unit tests
    ├── test_heat_transfer.py   # Thermal unit tests
    ├── test_data_dashboard.py  # Data analytics unit tests
    └── test_verification.py    # Quality assurance unit tests
```
