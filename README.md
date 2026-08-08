# ENGINEERING HUB

A professional, technically transparent, multi-module engineering calculation and data analysis platform.

## Overview
**ENGINEERING HUB** is designed to provide usable, verifiable, and transparent software tools for engineers, students, educators, and technical researchers. The application contains three primary engineering modules and a built-in verification suite.

---

## Core Engineering Modules

### 1. Pipe Flow Analyser
- **Physics**: Incompressible fluid hydraulics in circular conduit pipes using the Darcy-Weisbach frictional loss equation.
- **Friction Factor Method**: Implicit Colebrook-White equation solved via Newton-Raphson numerical iteration for turbulent flow ($Re \ge 4000$), exact laminar solution ($f = 64/Re$ for $Re < 2300$), and transitional blending.
- **Explicit Approximations**: Comparative calculations for Swamee-Jain and Haaland explicit friction factor equations.
- **Features**: Interactive pressure drop vs. volumetric flow rate curve, flow regime classification, SI unit handling, and CSV dataset export.

### 2. Heat Transfer Calculator
- **Flat-Wall Conduction**: One-dimensional steady-state thermal conduction across homogeneous single-layer walls using Fourier's Law ($\dot{Q} = kA(T_{hot} - T_{cold})/L$).
- **Newton's Law of Cooling**: Analytical solution to transient object cooling and ambient heating ($T(t) = T_\infty + (T_0 - T_\infty)e^{-kt}$). Calculates analytical time to reach target temperature ($t = -\frac{1}{k}\ln\frac{T_{target}-T_\infty}{T_0-T_\infty}$) with physical reachability validation.

### 3. Rock & Fluid Data Dashboard
- **Petrophysical & Geoscience Analytics**: Interactive CSV uploader and dataset analyzer pre-configured with core analysis and PVT fluid samples.
- **Data Filtering**: Automated column data-type detection, descriptive summary statistics (mean, std, percentiles), dynamic min-max range filters, and filtered CSV export.
- **Engineering Visualizations**: Porosity distribution histograms and Porosity vs. Permeability crossplots (with logarithmic axis scaling).

---

## Independent Hand-Calculation Verification

### Case 1: Pipe Flow Hydraulics
**Given**:
- Fluid: Water at 20°C ($\rho = 998.2\text{ kg/m}^3, \mu = 0.001002\text{ Pa}\cdot\text{s}$)
- Pipe: Internal Diameter $D = 0.1\text{ m}$, Length $L = 100\text{ m}$, Commercial Steel Roughness $\varepsilon = 0.000045\text{ m}$
- Flow Rate: $Q = 0.02\text{ m}^3/\text{s}$ ($20\text{ L/s}$)

**Hand Calculations**:
1. Cross-sectional Area $A = \frac{\pi (0.1)^2}{4} = 0.00785398\text{ m}^2$
2. Average Velocity $V = \frac{0.02}{0.00785398} = 2.54648\text{ m/s}$
3. Reynolds Number $Re = \frac{998.2 \times 2.54648 \times 0.1}{0.001002} = 253,683$ (Turbulent)
4. Relative Roughness $\frac{\varepsilon}{D} = \frac{0.000045}{0.1} = 0.00045$
5. Colebrook-White Friction Factor $f \approx 0.01815$
6. Dynamic Pressure $q = \frac{1}{2} \times 998.2 \times (2.54648)^2 = 3236.42\text{ Pa}$
7. Pressure Drop $\Delta P = f \left(\frac{L}{D}\right) q = 0.01815 \times \left(\frac{100}{0.1}\right) \times 3236.42 = 58,741\text{ Pa} = 58.74\text{ kPa}$

**Software Result**: $\Delta P = 58.74\text{ kPa}$ | **Difference**: $< 0.05\%$

---

### Case 2: Steady-State Wall Conduction
**Given**:
- Thickness $L = 0.2\text{ m}$, Area $A = 10.0\text{ m}^2$, Thermal Conductivity $k = 1.4\text{ W/(m}\cdot\text{K)}$ (Concrete), $T_{hot} = 100^\circ\text{C}$, $T_{cold} = 20^\circ\text{C}$

**Hand Calculation**:
1. $\Delta T = 100 - 20 = 80\text{ K}$
2. $\dot{Q} = \frac{1.4 \times 10 \times 80}{0.2} = 5,600\text{ W} = 5.60\text{ kW}$
3. $q'' = \frac{5600}{10} = 560\text{ W/m}^2$

**Software Result**: $\dot{Q} = 5.60\text{ kW}, q'' = 560.0\text{ W/m}^2$ | **Difference**: $0.00\%$

---

### Case 3: Newton's Law of Cooling
**Given**:
- Initial Temp $T_0 = 90^\circ\text{C}$, Ambient Temp $T_\infty = 20^\circ\text{C}$, Target Temp $T_{target} = 50^\circ\text{C}$, Cooling Constant $k = 0.05\text{ min}^{-1}$

**Hand Calculation**:
1. Temperature ratio $\frac{50 - 20}{90 - 20} = \frac{30}{70} = 0.428571$
2. Time $t = -\frac{\ln(0.428571)}{0.05} = -\frac{-0.847298}{0.05} = 16.946\text{ minutes}$

**Software Result**: $t = 16.95\text{ min}$ | **Difference**: $< 0.02\%$

---

## Project Structure
```
engineering-hub/
├── app.py                      # Streamlit main landing app
├── engineering.py              # Object-Oriented backend core logic (Fluid, Pipe, HeatTransfer)
├── requirements.txt            # Dependencies declaration
├── README.md                   # Complete documentation
├── src/                        # React / Web Frontend Engine
│   ├── App.tsx                 # Master multi-page routing
│   ├── components/             # Reusable UI cards, headers, plots
│   ├── lib/
│   │   ├── engineering.ts      # TypeScript core engineering classes
│   │   └── sampleData.ts       # Preset datasets & CSV parser
│   └── types.ts                # Shared TypeScript interfaces
└── tests/                      # Automated unit test suite
    ├── test_pipe_flow.py
    ├── test_heat_transfer.py
    └── test_data_dashboard.py
```

---

## Running the Application

### Option 1: Web Interface (Recommended)
The application is pre-bundled as a high-performance, modern Web single-page application running on port `3000`.

### Option 2: Streamlit Execution
To run via Python Streamlit:
```bash
pip install -r requirements.txt
streamlit run app.py
```

To run unit tests:
```bash
pytest tests/
```

---

## Assumptions & Limitations
1. **Pipe Flow**: Represents major frictional losses in circular pipes under steady incompressible single-phase flow. Minor component losses (elbows, valves) are excluded unless explicitly specified.
2. **Conduction**: Assumes 1D steady-state heat conduction across homogeneous flat walls with uniform properties and zero internal heat generation.
3. **Newton Cooling**: Assumes lumped-capacitance transient cooling with uniform internal body temperature distribution ($Bi < 0.1$).

---

## Safety & Engineering Disclaimer
This software is intended for educational, preliminary analysis, and engineering-support purposes. Results should be independently verified by a qualified professional engineer before being used for safety-critical design, operational, or commercial decisions.
