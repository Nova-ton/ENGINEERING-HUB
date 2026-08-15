"""
ENGINEERING HUB - Interactive Multi-Disciplinary Engineering Application
Built for Streamlit Community Cloud deployment.

Modules:
1. Pipe Flow Analyser (Colebrook-White Newton-Raphson & Darcy-Weisbach Hydraulics)
2. Heat Transfer Calculator (Fourier 1D Conduction & Newton's Law of Cooling)
3. Rock & Fluid Data Dashboard (Core & PVT Data Analytics, Distributions & Crossplots)
4. Independent Hand-Calculation Verification Suite
"""

import io
import os
import math
from typing import Dict, List, Any, Optional

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

from engineering import (
    Fluid,
    Pipe,
    HeatTransferCalculator,
    RockFluidAnalyzer,
    VerificationEngine,
    PRESET_FLUIDS,
    PIPE_ROUGHNESS_PRESETS,
    MATERIAL_THERMAL_CONDUCTIVITY_PRESETS,
)

# ==============================================================================
# 1. STREAMLIT PAGE CONFIG & GLOBAL STYLES
# ==============================================================================

st.set_page_config(
    page_title="ENGINEERING HUB",
    page_icon="⚙️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for crisp, high-contrast engineering UI
st.markdown(
    """
    <style>
    /* Main container styling */
    .main .block-container {
        padding-top: 1.5rem;
        padding-bottom: 3rem;
        max-width: 1200px;
    }
    
    /* Top disclaimer banner */
    .disclaimer-banner {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-left: 4px solid #0284c7;
        border-radius: 6px;
        padding: 12px 16px;
        font-size: 0.85rem;
        color: #334155;
        margin-bottom: 1.5rem;
        line-height: 1.4;
    }
    
    /* Module Cards */
    .module-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .module-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
    }
    .module-badge {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 3px 8px;
        border-radius: 4px;
        margin-bottom: 8px;
    }
    .badge-hydraulics { background-color: #e0f2fe; color: #0369a1; }
    .badge-thermal { background-color: #ffedd5; color: #c2410c; }
    .badge-data { background-color: #f3e8ff; color: #7e22ce; }
    .badge-verified { background-color: #dcfce7; color: #15803d; }
    
    /* Status indicators */
    .regime-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.82rem;
    }
    .regime-laminar { background-color: #dcfce7; color: #166534; }
    .regime-transitional { background-color: #fef9c3; color: #854d0e; }
    .regime-turbulent { background-color: #dbeafe; color: #1e40af; }
    
    /* Metric boxes */
    .eng-metric-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 14px;
        text-align: center;
    }
    .eng-metric-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
        font-weight: 600;
        margin-bottom: 4px;
    }
    .eng-metric-value {
        font-size: 1.4rem;
        font-weight: 700;
        color: #0f172a;
    }
    .eng-metric-sub {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 2px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ==============================================================================
# 2. SESSION STATE MANAGEMENT & ROUTING
# ==============================================================================

if "page" not in st.session_state:
    st.session_state["page"] = "home"

def set_page(page_name: str) -> None:
    """Updates the active page in session state."""
    st.session_state["page"] = page_name


# ==============================================================================
# 3. SIDEBAR NAVIGATION
# ==============================================================================

def render_sidebar():
    with st.sidebar:
        st.markdown("### ⚙️ **ENGINEERING HUB**")
        st.caption("Multi-Disciplinary Computational Suite")
        st.markdown("---")

        page_options = {
            "home": "🏠 Home / Overview",
            "pipe_flow": "🌊 Pipe Flow Analyser",
            "heat_transfer": "🔥 Heat Transfer Calculator",
            "rock_fluid_dashboard": "📊 Rock & Fluid Dashboard",
            "verification": "✅ Hand-Calculation Verification",
        }

        # Sidebar radio navigation
        current_page = st.session_state.get("page", "home")
        selected = st.radio(
            "Select Engineering Module",
            options=list(page_options.keys()),
            format_func=lambda x: page_options[x],
            index=list(page_options.keys()).index(current_page) if current_page in page_options else 0,
            key="sidebar_nav_radio",
        )

        if selected != current_page:
            st.session_state["page"] = selected
            st.rerun()

        st.markdown("---")
        st.markdown("#### 📌 **Engineering References**")
        st.markdown(
            """
            - **Colebrook-White (1939)**: Implicit friction factor equation
            - **Darcy-Weisbach**: Circular pipe head loss
            - **Fourier's Law**: 1D Steady-state conduction
            - **Newton's Cooling**: Lumped thermal decay
            - **Petrophysics**: Core & PVT lab analytics
            """
        )

        st.markdown("---")
        st.caption("Version: **2.4.0 (Production Release)**")
        st.caption("Deployment Target: **Streamlit Cloud**")


# ==============================================================================
# 4. VIEW: HOME / OVERVIEW
# ==============================================================================

def render_home_page():
    # Disclaimer Banner
    st.markdown(
        """
        <div class="disclaimer-banner">
            ⚠️ <strong>Engineering Disclaimer:</strong> This application is intended for academic, research, and preliminary engineering design evaluations.
            For safety-critical industrial applications, always perform independent peer review and apply appropriate design safety factors according to applicable industry codes (e.g., ASME, API, ISO).
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Hero Header
    st.markdown("## ⚙️ **ENGINEERING HUB**")
    st.markdown(
        "A rigorous, interactive computational suite combining **fluid mechanics**, **thermodynamics**, **petrophysical data science**, and **hand-calculation verification**."
    )
    st.markdown("<br>", unsafe_allow_html=True)

    # 3 Main Modules Bento Grid
    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown(
            """
            <div class="module-card">
                <span class="module-badge badge-hydraulics">Hydraulics & Fluid Mechanics</span>
                <h3 style="margin-top: 4px; margin-bottom: 8px;">🌊 Pipe Flow Analyser</h3>
                <p style="font-size: 0.88rem; color: #475569; min-height: 80px;">
                    Accurate hydrodynamic analysis of circular pipe networks. Solves the implicit Colebrook-White equation via 
                    <strong>Newton-Raphson iteration</strong>, classifies flow regimes, and generates complete Darcy-Weisbach pressure drop curves.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("🚀 Open Pipe Flow Analyser", key="btn_home_pipe_flow", use_container_width=True):
            set_page("pipe_flow")
            st.rerun()

    with col2:
        st.markdown(
            """
            <div class="module-card">
                <span class="module-badge badge-thermal">Thermal Engineering</span>
                <h3 style="margin-top: 4px; margin-bottom: 8px;">🔥 Heat Transfer Calculator</h3>
                <p style="font-size: 0.88rem; color: #475569; min-height: 80px;">
                    Dual-mode thermal engine: Steady-state 1D plane wall conduction (<strong>Fourier's Law</strong>) with material conductivity libraries, 
                    and transient lumped thermal response (<strong>Newton's Law of Cooling</strong>).
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("🚀 Open Heat Transfer Calculator", key="btn_home_heat_transfer", use_container_width=True):
            set_page("heat_transfer")
            st.rerun()

    with col3:
        st.markdown(
            """
            <div class="module-card">
                <span class="module-badge badge-data">Petrophysics & PVT Data</span>
                <h3 style="margin-top: 4px; margin-bottom: 8px;">📊 Rock & Fluid Dashboard</h3>
                <p style="font-size: 0.88rem; color: #475569; min-height: 80px;">
                    Interactive data explorer for core plug porosity/permeability distributions and PVT laboratory reports. 
                    Includes dynamic multi-variable filtering, summary statistics, histograms, and semi-log crossplots.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        if st.button("🚀 Open Rock & Fluid Dashboard", key="btn_home_dashboard", use_container_width=True):
            set_page("rock_fluid_dashboard")
            st.rerun()

    st.markdown("<br>", unsafe_allow_html=True)

    # Verification Section Callout
    v_col1, v_col2 = st.columns([3, 1])
    with v_col1:
        st.markdown(
            """
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
                <span class="module-badge badge-verified">Quality Assurance & Benchmark Testing</span>
                <h4 style="margin-top: 4px; margin-bottom: 4px; color: #166534;">✅ Independent Hand-Calculation Verification Suite</h4>
                <p style="font-size: 0.85rem; color: #14532d; margin-bottom: 0;">
                    Every numerical algorithm in this application is verified against published textbook problems with complete step-by-step analytical derivations.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with v_col2:
        st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)
        if st.button("🔍 Open Verification Suite", key="btn_home_verification", use_container_width=True):
            set_page("verification")
            st.rerun()

    st.markdown("<br>", unsafe_allow_html=True)

    # Quick Feature Summary Matrix
    st.markdown("### 📋 **Capabilities Overview**")
    summary_df = pd.DataFrame([
        {"Module": "Pipe Flow Analyser", "Core Equations": "Darcy-Weisbach, Colebrook-White, Haaland, Swamee-Jain", "Output Metrics": "Re, Velocity, Friction Factor, ΔP (kPa/bar/psi), Head Loss", "Visualizations": "Interactive ΔP vs Q Curve with Operating Point"},
        {"Module": "Wall Conduction", "Core Equations": "Fourier's 1D Heat Conduction Law", "Output Metrics": "Heat Rate Q (kW), Heat Flux (W/m²), Thermal Resistance (K/W)", "Visualizations": "Spatial Temperature Profile T(x)"},
        {"Module": "Newton's Cooling", "Core Equations": "Transient Lumped Thermal Response", "Output Metrics": "Time to Target Temp (min & sec), Rate Constant k", "Visualizations": "T(t) Exponential Decay Curve with Asymptotes"},
        {"Module": "Rock & Fluid Data", "Core Equations": "5-Number Summary, Log-Normal Distributions", "Output Metrics": "Porosity, Permeability, PVT Properties, Custom Datasets", "Visualizations": "Histograms, Porosity-Permeability Semi-Log Crossplots"},
        {"Module": "Verification Suite", "Core Equations": "Textbook Analytical Derivations", "Output Metrics": "Tolerance checks, % relative error, Pass/Fail matrix", "Visualizations": "Step-by-step Mathematical Proofs"},
    ])
    st.dataframe(summary_df, hide_index=True, use_container_width=True)


# ==============================================================================
# 5. VIEW: PIPE FLOW ANALYSER
# ==============================================================================

def render_pipe_flow_page():
    # Back to Home Button
    if st.button("← Back to Home / Dashboard", key="btn_back_pipe"):
        set_page("home")
        st.rerun()

    st.markdown("## 🌊 **Pipe Flow Analyser**")
    st.caption("Darcy-Weisbach circular pipe hydraulics & Colebrook-White Newton-Raphson friction factor solver.")
    st.markdown("---")

    # Quick Presets
    st.markdown("##### ⚡ **Quick Presets**")
    p_col1, p_col2, p_col3, p_col4 = st.columns(4)
    
    preset_water = p_col1.button("💧 Water in Steel Pipe (Standard)")
    preset_oil = p_col2.button("🛢️ Crude Oil Pipeline")
    preset_air = p_col3.button("💨 Air HVAC Duct")
    preset_reset = p_col4.button("🔄 Reset Defaults")

    # Initialize preset values in session state if needed
    if "pf_fluid_id" not in st.session_state or preset_reset:
        st.session_state["pf_fluid_id"] = "water"
        st.session_state["pf_density"] = 998.2
        st.session_state["pf_viscosity"] = 0.001002
        st.session_state["pf_diameter_mm"] = 100.0  # 100 mm
        st.session_state["pf_length_m"] = 100.0
        st.session_state["pf_roughness_mm"] = 0.045  # Commercial steel
        st.session_state["pf_flow_rate_lps"] = 20.0  # 20 L/s = 0.02 m3/s

    if preset_water:
        st.session_state["pf_fluid_id"] = "water"
        st.session_state["pf_density"] = 998.2
        st.session_state["pf_viscosity"] = 0.001002
        st.session_state["pf_diameter_mm"] = 100.0
        st.session_state["pf_length_m"] = 100.0
        st.session_state["pf_roughness_mm"] = 0.045
        st.session_state["pf_flow_rate_lps"] = 20.0
        st.rerun()

    if preset_oil:
        st.session_state["pf_fluid_id"] = "crude_oil"
        st.session_state["pf_density"] = 850.0
        st.session_state["pf_viscosity"] = 0.015
        st.session_state["pf_diameter_mm"] = 200.0
        st.session_state["pf_length_m"] = 500.0
        st.session_state["pf_roughness_mm"] = 0.045
        st.session_state["pf_flow_rate_lps"] = 50.0
        st.rerun()

    if preset_air:
        st.session_state["pf_fluid_id"] = "air"
        st.session_state["pf_density"] = 1.204
        st.session_state["pf_viscosity"] = 0.00001813
        st.session_state["pf_diameter_mm"] = 300.0
        st.session_state["pf_length_m"] = 50.0
        st.session_state["pf_roughness_mm"] = 0.0015
        st.session_state["pf_flow_rate_lps"] = 500.0
        st.rerun()

    st.markdown("<br>", unsafe_allow_html=True)

    # 2-Column Interface: Inputs on Left, Results on Right
    input_col, output_col = st.columns([1, 1.3], gap="large")

    with input_col:
        st.markdown("#### 📥 **Input Parameters**")

        # Fluid Selection
        fluid_options = list(PRESET_FLUIDS.keys())
        fluid_labels = {k: PRESET_FLUIDS[k]["name"] for k in fluid_options}
        
        current_fluid_id = st.session_state.get("pf_fluid_id", "water")
        selected_fluid_id = st.selectbox(
            "Fluid Preset",
            options=fluid_options,
            format_func=lambda k: fluid_labels[k],
            index=fluid_options.index(current_fluid_id) if current_fluid_id in fluid_options else 0,
            key="sb_fluid_select",
        )

        if selected_fluid_id != "custom":
            fluid_data = PRESET_FLUIDS[selected_fluid_id]
            density = float(fluid_data["density"])
            viscosity = float(fluid_data["dynamic_viscosity"])
            st.caption(f"Density: **{density:.1f} kg/m³** | Viscosity: **{viscosity:.6e} Pa·s**")
        else:
            density = st.number_input("Custom Density (kg/m³)", value=float(st.session_state.get("pf_density", 1000.0)), min_value=0.1, step=10.0)
            viscosity = st.number_input("Custom Dynamic Viscosity (Pa·s)", value=float(st.session_state.get("pf_viscosity", 0.001)), min_value=1e-7, format="%.6f", step=0.0001)

        # Create Fluid instance
        try:
            fluid_obj = Fluid(name=fluid_labels[selected_fluid_id], density=density, dynamic_viscosity=viscosity)
        except Exception as e:
            st.error(f"Fluid Configuration Error: {e}")
            return

        st.markdown("---")
        st.markdown("##### 📏 **Pipe Geometry**")

        diameter_mm = st.number_input("Internal Diameter (mm)", value=float(st.session_state.get("pf_diameter_mm", 100.0)), min_value=0.1, step=5.0)
        diameter_m = diameter_mm / 1000.0

        length_m = st.number_input("Pipe Length (m)", value=float(st.session_state.get("pf_length_m", 100.0)), min_value=0.0, step=10.0)

        # Roughness presets
        rough_options = [r["name"] for r in PIPE_ROUGHNESS_PRESETS] + ["Custom Absolute Roughness"]
        selected_rough_preset = st.selectbox("Inner Surface Material", options=rough_options, index=0)

        if selected_rough_preset != "Custom Absolute Roughness":
            matched = next(r for r in PIPE_ROUGHNESS_PRESETS if r["name"] == selected_rough_preset)
            roughness_m = matched["roughness"]
            roughness_mm = roughness_m * 1000.0
            st.caption(f"Absolute Roughness ε: **{roughness_mm:.4f} mm** ({roughness_m:.6e} m)")
        else:
            roughness_mm = st.number_input("Custom Roughness ε (mm)", value=float(st.session_state.get("pf_roughness_mm", 0.045)), min_value=0.0, format="%.4f", step=0.005)
            roughness_m = roughness_mm / 1000.0

        st.markdown("---")
        st.markdown("##### ⏱️ **Flow Rate**")

        flow_rate_lps = st.number_input("Volumetric Flow Rate (L/s)", value=float(st.session_state.get("pf_flow_rate_lps", 20.0)), min_value=0.0, step=1.0)
        flow_rate_m3s = flow_rate_lps / 1000.0
        flow_rate_m3h = flow_rate_m3s * 3600.0

        st.caption(f"Equivalent: **{flow_rate_m3s:.4f} m³/s** | **{flow_rate_m3h:.2f} m³/h**")

    with output_col:
        st.markdown("#### 📊 **Hydraulic Analysis & Results**")

        # Validation Checks
        if diameter_m <= 0:
            st.error("Pipe diameter must be strictly greater than 0.")
            return
        if length_m < 0:
            st.error("Pipe length cannot be negative.")
            return
        if roughness_m >= diameter_m:
            st.error(f"Pipe roughness ({roughness_m} m) must be smaller than internal diameter ({diameter_m} m).")
            return

        # Perform Calculation
        try:
            pipe_obj = Pipe(diameter=diameter_m, length=length_m, roughness=roughness_m)
            results = pipe_obj.analyze_flow(fluid_obj, flow_rate_m3s)
        except Exception as e:
            st.error(f"Calculation Error: {e}")
            return

        # Display any engineering warnings
        for w in results["warnings"]:
            st.warning(f"⚠️ {w}")

        # Flow Regime Badge
        regime_class = "regime-turbulent" if results["regime"] == "Turbulent" else ("regime-laminar" if results["regime"] == "Laminar" else "regime-transitional")
        st.markdown(
            f"""
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-size: 0.9rem; font-weight: 600; color: #475569;">Flow Regime:</span>
                <span class="regime-badge {regime_class}">{results['regime'].upper()} FLOW</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Primary Metrics Grid
        m1, m2, m3 = st.columns(3)
        with m1:
            st.markdown(
                f"""
                <div class="eng-metric-box">
                    <div class="eng-metric-label">Flow Velocity</div>
                    <div class="eng-metric-value">{results['velocity']:.3f} <span style="font-size: 0.85rem;">m/s</span></div>
                    <div class="eng-metric-sub">Area: {results['area']:.5f} m²</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with m2:
            st.markdown(
                f"""
                <div class="eng-metric-box">
                    <div class="eng-metric-label">Reynolds Number</div>
                    <div class="eng-metric-value">{results['reynolds_number']:,.0f}</div>
                    <div class="eng-metric-sub">ε/D: {results['relative_roughness']:.5f}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with m3:
            st.markdown(
                f"""
                <div class="eng-metric-box">
                    <div class="eng-metric-label">Darcy Friction (f)</div>
                    <div class="eng-metric-value">{results['friction_factor']:.5f}</div>
                    <div class="eng-metric-sub">Colebrook-White</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        st.markdown("<br>", unsafe_allow_html=True)

        # Pressure Drop Metrics
        p1, p2, p3 = st.columns(3)
        with p1:
            st.metric("Pressure Drop (ΔP)", f"{results['pressure_drop_kpa']:.2f} kPa", delta=None)
        with p2:
            st.metric("Pressure Drop (bar)", f"{results['pressure_drop_bar']:.4f} bar", delta=None)
        with p3:
            st.metric("Head Loss (h_f)", f"{results['head_loss_m']:.2f} m of fluid", delta=None)

        # Friction Factor Method Comparison Table
        with st.expander("🔍 View Friction Factor Equations Comparison"):
            comp_data = [
                {"Method": "Colebrook-White (Iterative Newton-Raphson)", "Friction Factor (f)": f"{results['friction_factor']:.6f}", "Type": "Implicit Exact Solution", "Status": "Standard Recommended"},
                {"Method": "Haaland Equation (1983)", "Friction Factor (f)": f"{results['haaland_friction_factor']:.6f}", "Type": "Explicit Approximation", "Status": f"Diff: {abs(results['haaland_friction_factor'] - results['friction_factor'])/max(results['friction_factor'], 1e-6)*100:.2f}%"},
                {"Method": "Swamee-Jain Equation (1976)", "Friction Factor (f)": f"{results['swamee_jain_friction_factor']:.6f}", "Type": "Explicit Approximation", "Status": f"Diff: {abs(results['swamee_jain_friction_factor'] - results['friction_factor'])/max(results['friction_factor'], 1e-6)*100:.2f}%"},
            ]
            st.table(pd.DataFrame(comp_data))

    # Interactive Pressure Drop vs Flow Rate Curve
    st.markdown("---")
    st.markdown("### 📈 **System Performance Curve (ΔP vs. Flow Rate Q)**")
    
    curve_points = pipe_obj.generate_pressure_drop_curve(fluid_obj, flow_rate_m3s, points_count=35)
    curve_df = pd.DataFrame(curve_points)

    fig = go.Figure()

    # Main Curve
    fig.add_trace(
        go.Scatter(
            x=curve_df["flow_rate_lps"],
            y=curve_df["pressure_drop_kpa"],
            mode="lines",
            name="ΔP vs Flow Rate",
            line=dict(color="#0284c7", width=3),
            hovertemplate="<b>Flow:</b> %{x:.2f} L/s<br><b>ΔP:</b> %{y:.2f} kPa<extra></extra>",
        )
    )

    # Operating Point Marker
    fig.add_trace(
        go.Scatter(
            x=[flow_rate_lps],
            y=[results["pressure_drop_kpa"]],
            mode="markers",
            name="Current Operating Point",
            marker=dict(color="#ef4444", size=13, symbol="diamond", line=dict(color="#ffffff", width=2)),
            hovertemplate=f"<b>Current Operating Point</b><br>Flow: {flow_rate_lps:.2f} L/s<br>ΔP: {results['pressure_drop_kpa']:.2f} kPa<extra></extra>",
        )
    )

    fig.update_layout(
        title="Darcy-Weisbach Pressure Drop vs. Volumetric Flow Rate",
        xaxis_title="Flow Rate (L/s)",
        yaxis_title="Pressure Drop (kPa)",
        hovermode="closest",
        margin=dict(l=40, r=40, t=50, b=40),
        template="plotly_white",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )

    st.plotly_chart(fig, use_container_width=True)

    # CSV Download
    results_export = {
        "Parameter": ["Fluid", "Density (kg/m3)", "Viscosity (Pa.s)", "Diameter (m)", "Length (m)", "Roughness (m)", "Flow Rate (m3/s)", "Velocity (m/s)", "Reynolds Number", "Regime", "Friction Factor", "Pressure Drop (kPa)", "Head Loss (m)"],
        "Value": [fluid_obj.name, fluid_obj.density, fluid_obj.dynamic_viscosity, diameter_m, length_m, roughness_m, flow_rate_m3s, results["velocity"], results["reynolds_number"], results["regime"], results["friction_factor"], results["pressure_drop_kpa"], results["head_loss_m"]]
    }
    csv_bytes = pd.DataFrame(results_export).to_csv(index=False).encode("utf-8")
    st.download_button(
        label="📥 Download Pipe Flow Calculation Results (CSV)",
        data=csv_bytes,
        file_name="pipe_flow_results.csv",
        mime="text/csv",
    )


# ==============================================================================
# 6. VIEW: HEAT TRANSFER CALCULATOR
# ==============================================================================

def render_heat_transfer_page():
    if st.button("← Back to Home / Dashboard", key="btn_back_heat"):
        set_page("home")
        st.rerun()

    st.markdown("## 🔥 **Heat Transfer Calculator**")
    st.caption("Steady-state 1D plane wall conduction & transient lumped Newton's Law of Cooling.")
    st.markdown("---")

    tab_conduction, tab_cooling = st.tabs(["🧱 1D Steady-State Wall Conduction", "⏱️ Transient Newton's Law of Cooling"])

    # --------------------------------------------------------------------------
    # TAB 1: WALL CONDUCTION
    # --------------------------------------------------------------------------
    with tab_conduction:
        st.markdown("#### **Fourier's Law of Heat Conduction**")
        st.markdown("$$\dot{Q} = \\frac{k \\cdot A \\cdot (T_{hot} - T_{cold})}{L}, \\quad q'' = \\frac{\dot{Q}}{A}$$")
        st.markdown("<br>", unsafe_allow_html=True)

        c_col1, c_col2 = st.columns([1, 1.2], gap="large")

        with c_col1:
            st.markdown("##### 📥 **Conduction Parameters**")

            # Material Presets
            mat_names = [m["name"] for m in MATERIAL_THERMAL_CONDUCTIVITY_PRESETS] + ["Custom Material"]
            selected_mat = st.selectbox("Select Wall Material", options=mat_names, index=4)  # Default: Concrete

            if selected_mat != "Custom Material":
                matched_mat = next(m for m in MATERIAL_THERMAL_CONDUCTIVITY_PRESETS if m["name"] == selected_mat)
                k_val = float(matched_mat["conductivity"])
                st.caption(f"Thermal Conductivity k: **{k_val:.3f} W/(m·K)** ({matched_mat['category']})")
            else:
                k_val = st.number_input("Custom Thermal Conductivity k (W/(m·K))", value=1.40, min_value=0.001, step=0.1)

            thickness_mm = st.number_input("Wall Thickness L (mm)", value=200.0, min_value=1.0, step=10.0)
            thickness_m = thickness_mm / 1000.0

            area_m2 = st.number_input("Wall Surface Area A (m²)", value=10.0, min_value=0.01, step=1.0)
            t_hot = st.number_input("Hot Face Temperature T_hot (°C)", value=100.0, step=5.0)
            t_cold = st.number_input("Cold Face Temperature T_cold (°C)", value=20.0, step=5.0)

        with c_col2:
            st.markdown("##### 📊 **Conduction Results**")

            try:
                cond_res = HeatTransferCalculator.calculate_conduction(
                    thickness=thickness_m, area=area_m2, thermal_conductivity=k_val, t_hot=t_hot, t_cold=t_cold
                )
            except Exception as e:
                st.error(f"Conduction Calculation Error: {e}")
                return

            # Results metric cards
            r1, r2 = st.columns(2)
            with r1:
                st.markdown(
                    f"""
                    <div class="eng-metric-box">
                        <div class="eng-metric-label">Heat Transfer Rate</div>
                        <div class="eng-metric-value">{cond_res['heat_transfer_rate_kw']:.3f} <span style="font-size: 0.85rem;">kW</span></div>
                        <div class="eng-metric-sub">{cond_res['heat_transfer_rate_w']:,.1f} W</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
            with r2:
                st.markdown(
                    f"""
                    <div class="eng-metric-box">
                        <div class="eng-metric-label">Heat Flux (q'')</div>
                        <div class="eng-metric-value">{cond_res['heat_flux_w_m2']:.1f} <span style="font-size: 0.85rem;">W/m²</span></div>
                        <div class="eng-metric-sub">ΔT: {cond_res['delta_t']:.1f} K</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

            st.markdown("<br>", unsafe_allow_html=True)
            r3, r4 = st.columns(2)
            with r3:
                st.metric("Thermal Resistance (R_th)", f"{cond_res['thermal_resistance']:.5f} K/W")
            with r4:
                st.metric("Temperature Gradient", f"{cond_res['temperature_gradient']:.1f} K/m")

            # Temperature distribution diagram
            prof_data = HeatTransferCalculator.generate_conduction_profile(thickness_m, t_hot, t_cold, points_count=20)
            prof_df = pd.DataFrame(prof_data)

            fig_cond = px.line(
                prof_df,
                x="position_mm",
                y="temperature_c",
                labels={"position_mm": "Wall Position x (mm)", "temperature_c": "Temperature (°C)"},
                title="Linear Temperature Profile Across Plane Wall",
            )
            fig_cond.update_traces(line=dict(color="#c2410c", width=3))
            fig_cond.update_layout(template="plotly_white", margin=dict(l=30, r=30, t=40, b=30))
            st.plotly_chart(fig_cond, use_container_width=True)

    # --------------------------------------------------------------------------
    # TAB 2: NEWTON'S LAW OF COOLING
    # --------------------------------------------------------------------------
    with tab_cooling:
        st.markdown("#### **Newton's Law of Cooling (Transient Lumped System)**")
        st.markdown("$$T(t) = T_{\\infty} + (T_0 - T_{\\infty}) e^{-k t}, \\quad t = -\\frac{1}{k} \\ln\\left(\\frac{T_{target} - T_{\\infty}}{T_0 - T_{\\infty}}\\right)$$")
        st.markdown("<br>", unsafe_allow_html=True)

        k_col1, k_col2 = st.columns([1, 1.2], gap="large")

        with k_col1:
            st.markdown("##### 📥 **Transient Cooling Inputs**")
            t_initial = st.number_input("Initial Temperature T_0 (°C)", value=90.0, step=5.0)
            t_ambient = st.number_input("Ambient Temperature T_ambient (°C)", value=20.0, step=2.0)
            t_target = st.number_input("Target Desired Temperature T_target (°C)", value=50.0, step=5.0)
            cooling_k = st.number_input("Cooling Constant k (1/min)", value=0.05, min_value=0.0001, format="%.4f", step=0.005)

            st.caption(f"Time Constant (τ = 1/k): **{1.0/cooling_k:.2f} min**")

        with k_col2:
            st.markdown("##### 📊 **Cooling Calculation Results**")

            try:
                cooling_res = HeatTransferCalculator.calculate_cooling(
                    t_initial=t_initial, t_ambient=t_ambient, t_target=t_target, cooling_constant=cooling_k
                )
            except Exception as e:
                st.error(f"Cooling Calculation Error: {e}")
                return

            if not cooling_res["is_achievable"]:
                st.warning(f"⚠️ {cooling_res['explanation']}")
            else:
                st.success(f"✅ {cooling_res['explanation']}")

                time_min = cooling_res["time_min"]
                time_sec = cooling_res["time_sec"]

                kr1, kr2 = st.columns(2)
                with kr1:
                    st.markdown(
                        f"""
                        <div class="eng-metric-box">
                            <div class="eng-metric-label">Time to Target</div>
                            <div class="eng-metric-value">{time_min:.2f} <span style="font-size: 0.85rem;">min</span></div>
                            <div class="eng-metric-sub">{time_sec:,.1f} seconds</div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                with kr2:
                    mode_str = "Cooling Process" if cooling_res["is_cooling"] else "Heating Process"
                    st.markdown(
                        f"""
                        <div class="eng-metric-box">
                            <div class="eng-metric-label">Thermal Regime</div>
                            <div class="eng-metric-value" style="font-size: 1.1rem; color: #0284c7;">{mode_str}</div>
                            <div class="eng-metric-sub">Ambient Asymptote: {t_ambient}°C</div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

            # Cooling Curve Plot
            cooling_points = HeatTransferCalculator.generate_cooling_curve(
                t_initial, t_ambient, t_target, cooling_k, points_count=60
            )
            cooling_df = pd.DataFrame(cooling_points)

            fig_cool = go.Figure()
            fig_cool.add_trace(
                go.Scatter(
                    x=cooling_df["time_min"],
                    y=cooling_df["temperature_c"],
                    mode="lines",
                    name="Temperature T(t)",
                    line=dict(color="#2563eb", width=3),
                )
            )
            fig_cool.add_hline(y=t_ambient, line_dash="dash", line_color="#64748b", annotation_text="Ambient Asymptote")
            fig_cool.add_hline(y=t_target, line_dash="dot", line_color="#10b981", annotation_text="Target Temp")

            if cooling_res["is_achievable"] and not math.isnan(cooling_res["time_min"]):
                fig_cool.add_trace(
                    go.Scatter(
                        x=[cooling_res["time_min"]],
                        y=[t_target],
                        mode="markers",
                        name="Target Reached",
                        marker=dict(color="#10b981", size=12, symbol="circle"),
                    )
                )

            fig_cool.update_layout(
                title="Transient Temperature Response T(t) vs. Time",
                xaxis_title="Time (minutes)",
                yaxis_title="Temperature (°C)",
                template="plotly_white",
                margin=dict(l=30, r=30, t=40, b=30),
            )
            st.plotly_chart(fig_cool, use_container_width=True)


# ==============================================================================
# 7. VIEW: ROCK & FLUID DATA DASHBOARD
# ==============================================================================

def render_rock_fluid_dashboard_page():
    if st.button("← Back to Home / Dashboard", key="btn_back_dashboard"):
        set_page("home")
        st.rerun()

    st.markdown("## 📊 **Rock & Fluid Data Dashboard**")
    st.caption("Petrophysical core plug properties, PVT laboratory data explorer, distributions, and crossplots.")
    st.markdown("---")

    # Data Loader Section
    st.markdown("#### 📂 **Dataset Source**")
    src_col1, src_col2, src_col3 = st.columns([1, 1, 1.5])

    data_choice = src_col1.radio(
        "Choose Data Source",
        options=["Preset: Core Plug Data", "Preset: PVT Black Oil Data", "Upload Custom CSV"],
        key="rb_data_source",
    )

    df: Optional[pd.DataFrame] = None
    data_title = ""

    if data_choice == "Preset: Core Plug Data":
        if os.path.exists("data/core_data.csv"):
            df = pd.read_csv("data/core_data.csv")
            data_title = "Petrophysical Core Plug Analysis (50 Samples)"
        else:
            st.error("Preset core data file not found.")
    elif data_choice == "Preset: PVT Black Oil Data":
        if os.path.exists("data/pvt_data.csv"):
            df = pd.read_csv("data/pvt_data.csv")
            data_title = "Black Oil Laboratory PVT Analysis"
        else:
            st.error("Preset PVT data file not found.")
    else:
        uploaded_file = st.file_uploader("Upload CSV File", type=["csv"])
        if uploaded_file is not None:
            try:
                df = pd.read_csv(uploaded_file)
                data_title = f"Uploaded Dataset: {uploaded_file.name}"
            except Exception as e:
                st.error(f"Error parsing CSV file: {e}")
                return

    if df is None or df.empty:
        st.info("Please select a preset dataset or upload a CSV file to begin analysis.")
        return

    st.markdown(f"### 📋 **{data_title}**")

    # Metrics Summary Bar
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total Rows", f"{len(df):,}")
    m2.metric("Total Columns", f"{len(df.columns)}")
    m3.metric("Numeric Variables", f"{len(numeric_cols)}")
    m4.metric("Categorical Variables", f"{len(cat_cols)}")

    st.markdown("---")

    # Interactive Multi-Variable Filtering Section
    st.markdown("#### 🔍 **Dynamic Data Filters**")
    filter_expander = st.expander("Open Interactive Range & Facies Filters", expanded=True)

    filtered_df = df.copy()

    with filter_expander:
        filt_cols = st.columns(min(len(numeric_cols), 3) if numeric_cols else 1)
        for i, col in enumerate(numeric_cols[:3]):
            with filt_cols[i % len(filt_cols)]:
                min_val = float(df[col].min())
                max_val = float(df[col].max())
                if min_val < max_val:
                    selected_range = st.slider(
                        f"Filter {col}",
                        min_value=min_val,
                        max_value=max_val,
                        value=(min_val, max_val),
                        key=f"slider_filter_{col}",
                    )
                    filtered_df = filtered_df[
                        (filtered_df[col] >= selected_range[0]) & (filtered_df[col] <= selected_range[1])
                    ]

        # Categorical Filter if available
        if cat_cols:
            cat_col = cat_cols[0]
            unique_cats = sorted(df[cat_col].dropna().unique().tolist())
            selected_cats = st.multiselect(f"Filter by {cat_col}", options=unique_cats, default=unique_cats)
            if selected_cats:
                filtered_df = filtered_df[filtered_df[cat_col].isin(selected_cats)]

    st.caption(f"Showing **{len(filtered_df):,}** of **{len(df):,}** records ({len(filtered_df)/len(df)*100:.1f}%)")

    # Data Table Viewer
    with st.expander("📄 View Filtered Data Table", expanded=False):
        st.dataframe(filtered_df, use_container_width=True)

    # 5-Number Summary Statistics Table
    st.markdown("---")
    st.markdown("#### 📐 **Statistical Moments & 5-Number Summary**")

    if not numeric_cols:
        st.warning("No numeric columns detected in the dataset.")
        return

    stats_list = []
    for col in numeric_cols:
        col_stats = RockFluidAnalyzer.compute_column_statistics(filtered_df[col].dropna().tolist(), col)
        stats_list.append({
            "Variable": col,
            "Count": col_stats["count"],
            "Mean": f"{col_stats['mean']:.3f}",
            "Std Dev": f"{col_stats['std']:.3f}",
            "Min": f"{col_stats['min']:.3f}",
            "P25 (Q1)": f"{col_stats['p25']:.3f}",
            "Median (Q2)": f"{col_stats['median']:.3f}",
            "P75 (Q3)": f"{col_stats['p75']:.3f}",
            "Max": f"{col_stats['max']:.3f}",
        })

    st.dataframe(pd.DataFrame(stats_list), hide_index=True, use_container_width=True)

    # Visual Analytics: Histogram & Crossplot
    st.markdown("---")
    st.markdown("#### 📈 **Visual Exploratory Analytics**")

    v_col1, v_col2 = st.columns(2)

    with v_col1:
        st.markdown("##### **1. Property Distribution Histogram**")
        hist_col = st.selectbox("Select Variable for Histogram", options=numeric_cols, index=0)
        num_bins = st.slider("Number of Bins", min_value=5, max_value=30, value=12)

        fig_hist = px.histogram(
            filtered_df,
            x=hist_col,
            nbins=num_bins,
            marginal="box",
            color_discrete_sequence=["#0284c7"],
            title=f"Distribution Histogram: {hist_col}",
        )
        fig_hist.update_layout(template="plotly_white", margin=dict(l=30, r=30, t=40, b=30))
        st.plotly_chart(fig_hist, use_container_width=True)

    with v_col2:
        st.markdown("##### **2. Petrophysical Crossplot / Scatter**")
        x_default_idx = 0
        y_default_idx = 1 if len(numeric_cols) > 1 else 0

        cross_x = st.selectbox("X-Axis Variable", options=numeric_cols, index=x_default_idx)
        cross_y = st.selectbox("Y-Axis Variable", options=numeric_cols, index=y_default_idx)
        
        color_col = None
        if cat_cols:
            color_col = st.selectbox("Color By", options=["None"] + cat_cols + numeric_cols, index=1 if cat_cols else 0)
            if color_col == "None":
                color_col = None

        log_y = st.checkbox("Logarithmic Y-Axis (e.g. Permeability semi-log)", value=(cross_y.lower().startswith("perm")))

        fig_scatter = px.scatter(
            filtered_df,
            x=cross_x,
            y=cross_y,
            color=color_col,
            log_y=log_y,
            title=f"Crossplot: {cross_y} vs. {cross_x}",
            trendline="ols" if (color_col is None and not log_y and len(filtered_df) > 2) else None,
        )
        fig_scatter.update_layout(template="plotly_white", margin=dict(l=30, r=30, t=40, b=30))
        st.plotly_chart(fig_scatter, use_container_width=True)

    # Correlation Heatmap
    if len(numeric_cols) >= 3:
        st.markdown("##### **3. Property Correlation Matrix**")
        corr_matrix = filtered_df[numeric_cols].corr()
        fig_corr = px.imshow(
            corr_matrix,
            text_auto=True,
            aspect="auto",
            color_continuous_scale="Blues",
            title="Pearson Correlation Coefficients Matrix",
        )
        fig_corr.update_layout(template="plotly_white", margin=dict(l=30, r=30, t=40, b=30))
        st.plotly_chart(fig_corr, use_container_width=True)

    # CSV Download of Filtered Data
    filtered_csv = filtered_df.to_csv(index=False).encode("utf-8")
    st.download_button(
        label="📥 Download Filtered Dataset (CSV)",
        data=filtered_csv,
        file_name="filtered_rock_fluid_data.csv",
        mime="text/csv",
    )


# ==============================================================================
# 8. VIEW: INDEPENDENT HAND-CALCULATION VERIFICATION SUITE
# ==============================================================================

def render_verification_page():
    if st.button("← Back to Home / Dashboard", key="btn_back_verif"):
        set_page("home")
        st.rerun()

    st.markdown("## ✅ **Independent Hand-Calculation Verification Suite**")
    st.caption("Mathematical validation of the application calculations against textbook derivations within strict tolerances.")
    st.markdown("---")

    summary = VerificationEngine.run_all_tests()
    test_cases = summary["test_cases"]

    # Global Quality Badge
    if summary["all_passed"]:
        st.success(f"🎉 **ALL TESTS PASSED ({summary['passed_tests']}/{summary['total_tests']})** — All software outputs strictly conform to independent hand-calculation solutions within specified tolerances.")
    else:
        st.error(f"❌ {summary['total_tests'] - summary['passed_tests']} test(s) failed verification check.")

    st.markdown("<br>", unsafe_allow_html=True)

    # Render each test case card
    for case in test_cases:
        status_icon = "✅ PASSED" if case["passed"] else "❌ FAILED"
        status_color = "#15803d" if case["passed"] else "#b91c1c"

        with st.container():
            st.markdown(
                f"""
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; background-color: #ffffff;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; color: #0f172a;">{case['module']}: {case['name']}</h4>
                        <span style="font-weight: 700; color: {status_color}; font-size: 0.9rem;">{status_icon}</span>
                    </div>
                    <p style="font-size: 0.85rem; color: #475569; margin-top: 6px; margin-bottom: 12px;">{case['description']}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )

            c1, c2 = st.columns([1, 1.4])

            with c1:
                st.markdown("##### 📌 **Given Benchmark Inputs**")
                for k, v in case["inputs"].items():
                    st.markdown(f"- **{k}**: `{v}`")

            with c2:
                st.markdown("##### 📊 **Outputs Comparison vs. Hand Solution**")
                comp_rows = []
                for out_name, exp_data in case["expectedOutputs"].items():
                    calc_val = case["calculatedOutputs"].get(out_name, 0.0)
                    exp_val = exp_data["value"]
                    diff_pct = abs(calc_val - exp_val) / max(exp_val, 1e-6) * 100.0
                    passed_out = diff_pct <= exp_data["tolerancePercent"]
                    comp_rows.append({
                        "Parameter": out_name,
                        "Expected (Hand)": f"{exp_val:,.4f} {exp_data['unit']}",
                        "Calculated (Software)": f"{calc_val:,.4f} {exp_data['unit']}",
                        "Tolerance": f"±{exp_data['tolerancePercent']}%",
                        "Difference": f"{diff_pct:.2f}%",
                        "Status": "✅ PASS" if passed_out else "❌ FAIL",
                    })

                st.table(pd.DataFrame(comp_rows))

            # Expandable Step-by-Step Hand Derivations
            with st.expander(f"📝 View Step-by-Step Hand Calculation Derivations for {case['module']}"):
                for step in case["handCalculationSteps"]:
                    st.markdown(f"- {step}")

            st.markdown("---")


# ==============================================================================
# 9. MAIN APPLICATION ROUTER
# ==============================================================================

def main():
    render_sidebar()
    current_page = st.session_state.get("page", "home")

    if current_page == "home":
        render_home_page()
    elif current_page == "pipe_flow":
        render_pipe_flow_page()
    elif current_page == "heat_transfer":
        render_heat_transfer_page()
    elif current_page == "rock_fluid_dashboard":
        render_rock_fluid_dashboard_page()
    elif current_page == "verification":
        render_verification_page()
    else:
        render_home_page()


if __name__ == "__main__":
    main()
