"""
ENGINEERING HUB - Streamlit Main Application Entrypoint
"""

import streamlit as st

st.set_page_config(
    page_title="ENGINEERING HUB",
    page_icon="⚙️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom Styling
st.markdown(
    """
    <style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 0px;
    }
    .sub-title {
        font-size: 1.0rem;
        color: #475569;
        margin-bottom: 20px;
    }
    .disclaimer-box {
        background-color: #fef3c7;
        border-left: 4px solid #d97706;
        padding: 10px;
        font-size: 0.8rem;
        color: #78350f;
        margin-bottom: 20px;
    }
    </style>
""",
    unsafe_allow_html=True,
)

# Disclaimer
st.markdown(
    '<div class="disclaimer-box"><strong>Engineering Disclaimer:</strong> Intended for educational, preliminary analysis, and engineering-support purposes. Results should be independently verified by a qualified engineer.</div>',
    unsafe_allow_html=True,
)

st.markdown('<div class="main-title">ENGINEERING HUB</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-title">Practical engineering calculations and data analysis tools.</div>',
    unsafe_allow_html=True,
)

st.divider()

col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("PIPE FLOW ANALYSER")
    st.write(
        "Analyse flow through circular pipes using fluid properties, pipe geometry and flow rate."
    )
    st.info("Features: Darcy-Weisbach, Colebrook-White Newton-Raphson solver, pressure drop curves.")

with col2:
    st.subheader("HEAT TRANSFER CALCULATOR")
    st.write(
        "Perform steady-state wall conduction and transient Newton's Law of Cooling calculations."
    )
    st.info("Features: Fourier's Law 1D wall conduction, transient cooling time analytical solutions.")

with col3:
    st.subheader("ROCK & FLUID DATA DASHBOARD")
    st.write(
        "Upload, analyse, filter and visualize engineering rock or fluid datasets."
    )
    st.info("Features: CSV drag-and-drop, summary statistics, porosity histograms & poro-perm crossplots.")

st.divider()

st.subheader("Independent Hand-Calculation Verification")
st.write(
    "All engineering calculations are benchmarked against independent textbook hand calculations."
)
st.success("Pipe Flow, Wall Conduction, and Newton Cooling verification test cases available.")
