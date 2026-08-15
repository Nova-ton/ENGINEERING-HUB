"""
ENGINEERING HUB - Core Object-Oriented Engineering Logic & Models

This module provides the core calculation engines for:
1. Circular Pipe Hydraulics & Friction Loss (Darcy-Weisbach & Colebrook-White Newton-Raphson solver)
2. Steady-State 1D Wall Conduction (Fourier's Law) & Transient Lumped Cooling (Newton's Law of Cooling)
3. Petrophysical / Fluid Data Analytics (Statistical distributions, filtering, and crossplots)
4. Independent Hand-Calculation Verification Suite

All core equations follow standard SI units internally.
"""

import math
from typing import Dict, List, Tuple, Optional, Any, Union


# ==============================================================================
# PRESET ENGINEERING CONSTANTS & MATERIALS
# ==============================================================================

PRESET_FLUIDS: Dict[str, Dict[str, Any]] = {
    "water": {
        "id": "water",
        "name": "Water (20°C, 1 atm)",
        "density": 998.2,  # kg/m^3
        "dynamic_viscosity": 0.001002,  # Pa*s
        "description": "Standard fresh water at standard laboratory conditions.",
    },
    "air": {
        "id": "air",
        "name": "Air (20°C, 1 atm)",
        "density": 1.204,  # kg/m^3
        "dynamic_viscosity": 0.00001813,  # Pa*s
        "description": "Dry air at standard room temperature and atmospheric pressure.",
    },
    "crude_oil": {
        "id": "crude_oil",
        "name": "Medium Crude Oil (15°C)",
        "density": 850.0,  # kg/m^3
        "dynamic_viscosity": 0.015,  # Pa*s
        "description": "Typical medium crude oil at standard surface conditions.",
    },
    "heavy_fuel_oil": {
        "id": "heavy_fuel_oil",
        "name": "Heavy Fuel Oil (50°C)",
        "density": 960.0,  # kg/m^3
        "dynamic_viscosity": 0.150,  # Pa*s
        "description": "Viscous fuel oil used in marine and thermal generation.",
    },
    "gasoline": {
        "id": "gasoline",
        "name": "Gasoline (20°C)",
        "density": 720.0,  # kg/m^3
        "dynamic_viscosity": 0.0006,  # Pa*s
        "description": "Light petroleum motor fuel.",
    },
    "custom": {
        "id": "custom",
        "name": "User-Defined Custom Fluid",
        "density": 1000.0,
        "dynamic_viscosity": 0.001,
        "description": "Manually specify custom density and dynamic viscosity.",
    },
}

PIPE_ROUGHNESS_PRESETS: List[Dict[str, Any]] = [
    {"name": "Commercial Steel / Wrought Iron", "roughness": 0.000045, "label": "0.045 mm"},
    {"name": "Drawn Tubing / Smooth Brass / Glass", "roughness": 0.0000015, "label": "0.0015 mm"},
    {"name": "Galvanized Iron", "roughness": 0.00015, "label": "0.15 mm"},
    {"name": "Cast Iron (Unlined)", "roughness": 0.00026, "label": "0.26 mm"},
    {"name": "Concrete (Smooth / Finished)", "roughness": 0.0003, "label": "0.30 mm"},
    {"name": "Riveted Steel", "roughness": 0.0009, "label": "0.90 mm"},
]

MATERIAL_THERMAL_CONDUCTIVITY_PRESETS: List[Dict[str, Any]] = [
    {"name": "Copper (Pure)", "conductivity": 385.0, "category": "Metals"},
    {"name": "Aluminum (1100)", "conductivity": 205.0, "category": "Metals"},
    {"name": "Carbon Steel (Structural)", "conductivity": 50.0, "category": "Metals"},
    {"name": "Stainless Steel (304)", "conductivity": 16.2, "category": "Metals"},
    {"name": "Concrete (Dense)", "conductivity": 1.4, "category": "Building Materials"},
    {"name": "Glass (Window)", "conductivity": 0.80, "category": "Building Materials"},
    {"name": "Red Brick", "conductivity": 0.72, "category": "Building Materials"},
    {"name": "Pine / Soft Wood", "conductivity": 0.13, "category": "Insulators"},
    {"name": "Fiberglass Thermal Insulation", "conductivity": 0.040, "category": "Insulators"},
    {"name": "Mineral Wool Insulation", "conductivity": 0.038, "category": "Insulators"},
    {"name": "Polyurethane Foam", "conductivity": 0.026, "category": "Insulators"},
]


# ==============================================================================
# CLASS 1: FLUID (FLUID THERMOPHYSICAL PROPERTIES)
# ==============================================================================

class Fluid:
    """
    Represents fluid physical properties for hydrodynamic and thermal calculations.

    Attributes:
        name (str): Identifier name of the fluid.
        density (float): Fluid mass density rho in kg/m^3.
        dynamic_viscosity (float): Dynamic viscosity mu in Pa*s (kg/(m*s)).
        description (str): Explanatory note or source conditions.
    """

    def __init__(self, name: str, density: float, dynamic_viscosity: float, description: str = "") -> None:
        """
        Initializes a Fluid instance.

        Args:
            name: Identifier for the fluid.
            density: Mass density in kg/m^3 (must be > 0).
            dynamic_viscosity: Dynamic viscosity in Pa*s (must be > 0).
            description: Optional text description.

        Raises:
            ValueError: If density <= 0 or dynamic_viscosity <= 0.
        """
        if density <= 0:
            raise ValueError(f"Fluid density must be greater than zero kg/m³, received: {density}")
        if dynamic_viscosity <= 0:
            raise ValueError(f"Dynamic viscosity must be greater than zero Pa·s, received: {dynamic_viscosity}")

        self.name = str(name).strip() or "Unnamed Fluid"
        self.density = float(density)
        self.dynamic_viscosity = float(dynamic_viscosity)
        self.description = description

    @property
    def kinematic_viscosity(self) -> float:
        """
        Calculates kinematic viscosity nu = mu / rho in m^2/s.

        Returns:
            Kinematic viscosity in m^2/s.
        """
        return self.dynamic_viscosity / self.density

    def to_dict(self) -> Dict[str, Any]:
        """
        Exports fluid properties as a dictionary.

        Returns:
            Dictionary with name, density, dynamic_viscosity, and kinematic_viscosity.
        """
        return {
            "name": self.name,
            "density": self.density,
            "dynamic_viscosity": self.dynamic_viscosity,
            "kinematic_viscosity": self.kinematic_viscosity,
            "description": self.description,
        }

    def __repr__(self) -> str:
        return f"Fluid(name='{self.name}', rho={self.density:.1f} kg/m³, mu={self.dynamic_viscosity:.6e} Pa·s)"


# ==============================================================================
# CLASS 2: PIPE (CIRCULAR PIPE HYDRAULICS & DARCY-WEISBACH SOLVER)
# ==============================================================================

class Pipe:
    """
    Represents circular pipe geometry and computes fluid flow friction, Reynolds number,
    and Darcy-Weisbach pressure drop using the exact Newton-Raphson Colebrook-White solver.

    Attributes:
        diameter (float): Pipe internal diameter D in meters.
        length (float): Pipe total length L in meters.
        roughness (float): Absolute inner pipe surface roughness epsilon in meters.
    """

    def __init__(self, diameter: float, length: float, roughness: float) -> None:
        """
        Initializes a Pipe instance with geometric parameters.

        Args:
            diameter: Internal pipe diameter D in meters (must be > 0).
            length: Pipe length L in meters (must be >= 0).
            roughness: Surface roughness epsilon in meters (must be >= 0 and < diameter).

        Raises:
            ValueError: If diameter <= 0, length < 0, roughness < 0, or roughness >= diameter.
        """
        if diameter <= 0:
            raise ValueError(f"Pipe internal diameter must be greater than zero meters, received: {diameter}")
        if length < 0:
            raise ValueError(f"Pipe length cannot be negative, received: {length}")
        if roughness < 0:
            raise ValueError(f"Pipe roughness cannot be negative, received: {roughness}")
        if roughness >= diameter:
            raise ValueError(f"Pipe roughness ({roughness} m) must be strictly smaller than internal diameter ({diameter} m).")

        self.diameter = float(diameter)
        self.length = float(length)
        self.roughness = float(roughness)

    @property
    def area(self) -> float:
        """
        Computes circular cross-sectional flow area A = pi * D^2 / 4 in m^2.

        Returns:
            Flow area in m^2.
        """
        return (math.pi * self.diameter ** 2) / 4.0

    @property
    def relative_roughness(self) -> float:
        """
        Computes dimensionless relative roughness epsilon / D.

        Returns:
            Relative roughness ratio.
        """
        return self.roughness / self.diameter

    def calculate_velocity(self, flow_rate: float) -> float:
        """
        Calculates average cross-sectional flow velocity V = Q / A in m/s.

        Args:
            flow_rate: Volumetric flow rate Q in m^3/s (must be >= 0).

        Returns:
            Average flow velocity in m/s.

        Raises:
            ValueError: If flow_rate < 0.
        """
        if flow_rate < 0:
            raise ValueError(f"Volumetric flow rate cannot be negative, received: {flow_rate}")
        return flow_rate / self.area

    def calculate_reynolds_number(self, fluid: Fluid, velocity: float) -> float:
        """
        Calculates dimensionless Reynolds Number Re = (rho * V * D) / mu.

        Args:
            fluid: Fluid instance containing density and viscosity.
            velocity: Flow velocity V in m/s.

        Returns:
            Reynolds number Re.
        """
        return (fluid.density * velocity * self.diameter) / fluid.dynamic_viscosity

    @staticmethod
    def classify_regime(re: float) -> str:
        """
        Classifies hydrodynamic flow regime according to standard Reynolds thresholds.

        Args:
            re: Reynolds number.

        Returns:
            'Laminar' (Re < 2300), 'Transitional' (2300 <= Re < 4000), or 'Turbulent' (Re >= 4000).
        """
        if re < 2300:
            return "Laminar"
        elif re < 4000:
            return "Transitional"
        else:
            return "Turbulent"

    @staticmethod
    def calculate_haaland_friction_factor(re: float, rel_roughness: float) -> float:
        """
        Computes explicit Haaland (1983) approximation for Darcy friction factor f:
        1/sqrt(f) = -1.8 * log10( (rel_roughness / 3.7)^1.11 + 6.9 / Re )

        Args:
            re: Reynolds number.
            rel_roughness: Relative roughness epsilon / D.

        Returns:
            Darcy friction factor f.
        """
        if re <= 0:
            return 0.0
        if re < 2300:
            return 64.0 / re
        term = math.pow(rel_roughness / 3.7, 1.11) + (6.9 / re)
        inv_sqrt_f = -1.8 * math.log10(term)
        return (1.0 / inv_sqrt_f) ** 2

    @staticmethod
    def calculate_swamee_jain_friction_factor(re: float, rel_roughness: float) -> float:
        """
        Computes explicit Swamee-Jain (1976) approximation for Darcy friction factor f:
        f = 0.25 / [log10( (rel_roughness / 3.7) + 5.74 / (Re^0.9) )]^2

        Args:
            re: Reynolds number.
            rel_roughness: Relative roughness epsilon / D.

        Returns:
            Darcy friction factor f.
        """
        if re <= 0:
            return 0.0
        if re < 2300:
            return 64.0 / re
        denom = math.log10((rel_roughness / 3.7) + (5.74 / (re ** 0.9)))
        return 0.25 / (denom ** 2)

    @classmethod
    def calculate_colebrook_friction_factor(cls, re: float, rel_roughness: float) -> float:
        """
        Solves the implicit Colebrook-White equation for Darcy friction factor f via Newton-Raphson:
        1/sqrt(f) = -2 * log10( (epsilon / 3.7D) + 2.51 / (Re * sqrt(f)) )

        Args:
            re: Reynolds number.
            rel_roughness: Relative roughness epsilon / D.

        Returns:
            Iteratively solved Darcy friction factor f.
        """
        if re <= 0:
            return 0.0
        if re < 2300:
            return 64.0 / re
        if 2300 <= re < 4000:
            # Linear interpolation across transitional zone
            f_lam = 64.0 / 2300.0
            f_turb_4000 = cls._solve_colebrook_newton(4000.0, rel_roughness)
            factor = (re - 2300.0) / (4000.0 - 2300.0)
            return f_lam + factor * (f_turb_4000 - f_lam)

        return cls._solve_colebrook_newton(re, rel_roughness)

    @staticmethod
    def _solve_colebrook_newton(re: float, rel_roughness: float) -> float:
        """
        Iterative Newton-Raphson numerical root-finder for the Colebrook-White equation.

        Args:
            re: Turbulent Reynolds number (>= 4000).
            rel_roughness: Relative roughness epsilon / D.

        Returns:
            Converged Darcy friction factor f.
        """
        # Initial guess from Haaland formula
        f = Pipe.calculate_haaland_friction_factor(re, rel_roughness)
        max_iter = 100
        tol = 1e-8

        for _ in range(max_iter):
            if f <= 0:
                f = 0.02
            sqrt_f = math.sqrt(f)
            arg = (rel_roughness / 3.7) + (2.51 / (re * sqrt_f))
            if arg <= 0:
                break

            g = (1.0 / sqrt_f) + 2.0 * math.log10(arg)

            if abs(g) < tol:
                return f

            # Derivative dg/df:
            # d/df (f^-0.5) = -0.5 * f^-1.5
            # d/df (2*log10(arg)) = (2 / (arg * ln(10))) * (-2.51 / (2 * Re * f^1.5))
            dg = (-0.5 / (f * sqrt_f)) + (2.0 / (arg * math.log(10.0))) * (-2.51 / (2.0 * re * f * sqrt_f))

            if abs(dg) < 1e-12:
                break

            next_f = f - (g / dg)
            if abs(next_f - f) < tol:
                return max(next_f, 0.001)
            f = max(next_f, 0.001)

        return f

    def analyze_flow(self, fluid: Fluid, flow_rate: float) -> Dict[str, Any]:
        """
        Computes complete pipe flow hydraulic characteristics and pressure drop.

        Args:
            fluid: Fluid physical property instance.
            flow_rate: Volumetric flow rate Q in m^3/s.

        Returns:
            Dictionary containing:
                - area (m^2)
                - velocity (m/s)
                - reynolds_number (float)
                - regime (str)
                - friction_factor (float)
                - haaland_friction_factor (float)
                - swamee_jain_friction_factor (float)
                - pressure_drop_pa (float)
                - pressure_drop_kpa (float)
                - pressure_drop_bar (float)
                - pressure_drop_psi (float)
                - dynamic_pressure (Pa)
                - head_loss_m (m)
                - relative_roughness (float)
                - method_used (str)
                - warnings (List[str])
        """
        warnings: List[str] = []

        if flow_rate == 0:
            return {
                "area": self.area,
                "velocity": 0.0,
                "reynolds_number": 0.0,
                "regime": "Laminar",
                "friction_factor": 0.0,
                "haaland_friction_factor": 0.0,
                "swamee_jain_friction_factor": 0.0,
                "pressure_drop_pa": 0.0,
                "pressure_drop_kpa": 0.0,
                "pressure_drop_bar": 0.0,
                "pressure_drop_psi": 0.0,
                "dynamic_pressure": 0.0,
                "head_loss_m": 0.0,
                "relative_roughness": self.relative_roughness,
                "method_used": "Zero Flow (No velocity or friction)",
                "warnings": ["Flow rate is zero. No velocity or pressure loss."],
            }

        velocity = self.calculate_velocity(flow_rate)
        re = self.calculate_reynolds_number(fluid, velocity)
        regime = self.classify_regime(re)
        rel_rough = self.relative_roughness

        f_colebrook = self.calculate_colebrook_friction_factor(re, rel_rough)
        f_haaland = self.calculate_haaland_friction_factor(re, rel_rough)
        f_swamee = self.calculate_swamee_jain_friction_factor(re, rel_rough)

        if regime == "Laminar":
            method_used = "Exact Laminar Analytical (f = 64 / Re)"
        elif regime == "Transitional":
            method_used = "Transitional Linear Interpolation (2300 ≤ Re < 4000)"
            warnings.append("Flow is in the transitional regime (2300 ≤ Re < 4000); flow and friction may fluctuate.")
        else:
            method_used = "Colebrook-White (Newton-Raphson Iterative Solution)"

        if velocity > 15.0 and fluid.density > 500:
            warnings.append(f"High liquid velocity ({velocity:.2f} m/s) detected. Check for pipe erosion and water hammer.")

        # Darcy-Weisbach equation: deltaP = f * (L / D) * (0.5 * rho * V^2)
        dynamic_pressure = 0.5 * fluid.density * (velocity ** 2)
        pressure_drop_pa = f_colebrook * (self.length / self.diameter) * dynamic_pressure if self.length > 0 else 0.0
        pressure_drop_kpa = pressure_drop_pa / 1000.0
        pressure_drop_bar = pressure_drop_pa / 100000.0
        pressure_drop_psi = pressure_drop_pa / 6894.757
        head_loss_m = pressure_drop_pa / (fluid.density * 9.80665) if fluid.density > 0 else 0.0

        return {
            "area": self.area,
            "velocity": velocity,
            "reynolds_number": re,
            "regime": regime,
            "friction_factor": f_colebrook,
            "haaland_friction_factor": f_haaland,
            "swamee_jain_friction_factor": f_swamee,
            "pressure_drop_pa": pressure_drop_pa,
            "pressure_drop_kpa": pressure_drop_kpa,
            "pressure_drop_bar": pressure_drop_bar,
            "pressure_drop_psi": pressure_drop_psi,
            "dynamic_pressure": dynamic_pressure,
            "head_loss_m": head_loss_m,
            "relative_roughness": rel_rough,
            "method_used": method_used,
            "warnings": warnings,
        }

    def generate_pressure_drop_curve(
        self, fluid: Fluid, operating_flow_rate: float, points_count: int = 35
    ) -> List[Dict[str, Any]]:
        """
        Generates data points for an interactive Flow Rate vs. Pressure Drop curve.

        Args:
            fluid: Fluid physical property instance.
            operating_flow_rate: Current user operating flow rate Q in m^3/s.
            points_count: Number of points to generate along the curve.

        Returns:
            List of point dictionaries with flowRate, velocity, reynoldsNumber, frictionFactor,
            pressureDropKPa, regime, and isOperatingPoint flag.
        """
        safe_q = max(operating_flow_rate, 0.0001)
        min_q = safe_q * 0.10
        max_q = safe_q * 2.20
        step = (max_q - min_q) / max(points_count - 1, 1)

        test_q_list = [min_q + i * step for i in range(points_count)]
        # Ensure operating point is explicitly in the curve
        if not any(abs(q - safe_q) < step * 0.1 for q in test_q_list):
            test_q_list.append(safe_q)
            test_q_list.sort()

        points: List[Dict[str, Any]] = []
        for q in test_q_list:
            res = self.analyze_flow(fluid, q)
            is_op = abs(q - safe_q) < 1e-7
            points.append({
                "flow_rate_m3s": q,
                "flow_rate_lps": q * 1000.0,
                "flow_rate_m3h": q * 3600.0,
                "velocity_ms": res["velocity"],
                "reynolds_number": res["reynolds_number"],
                "friction_factor": res["friction_factor"],
                "pressure_drop_kpa": res["pressure_drop_kpa"],
                "pressure_drop_bar": res["pressure_drop_bar"],
                "regime": res["regime"],
                "is_operating_point": is_op,
            })

        return points


# ==============================================================================
# CLASS 3: HEAT TRANSFER CALCULATOR (FOURIER CONDUCTION & NEWTON COOLING)
# ==============================================================================

class HeatTransferCalculator:
    """
    Handles steady-state 1D wall conduction (Fourier's Law) and transient
    lumped-system cooling calculations (Newton's Law of Cooling).
    """

    @staticmethod
    def calculate_conduction(
        thickness: float, area: float, thermal_conductivity: float, t_hot: float, t_cold: float
    ) -> Dict[str, Any]:
        """
        Calculates steady-state 1D heat conduction rate through a plane wall using Fourier's Law:
        Q_dot = (k * A * (T_hot - T_cold)) / L

        Args:
            thickness: Wall thickness L in meters (must be > 0).
            area: Heat transfer surface area A in m^2 (must be > 0).
            thermal_conductivity: Thermal conductivity k in W/(m*K) (must be > 0).
            t_hot: Hot face temperature in °C.
            t_cold: Cold face temperature in °C.

        Returns:
            Dictionary containing:
                - heat_transfer_rate_w (W)
                - heat_transfer_rate_kw (kW)
                - heat_flux_w_m2 (W/m^2)
                - delta_t (°C or K)
                - temperature_gradient (K/m)
                - thermal_resistance (K/W)

        Raises:
            ValueError: If thickness <= 0, area <= 0, or thermal_conductivity <= 0.
        """
        if thickness <= 0:
            raise ValueError(f"Wall thickness must be greater than zero meters, received: {thickness}")
        if area <= 0:
            raise ValueError(f"Wall surface area must be greater than zero m², received: {area}")
        if thermal_conductivity <= 0:
            raise ValueError(f"Thermal conductivity must be greater than zero W/(m·K), received: {thermal_conductivity}")

        delta_t = t_hot - t_cold
        temp_gradient = delta_t / thickness
        thermal_resistance = thickness / (thermal_conductivity * area)

        q_dot_w = (thermal_conductivity * area * delta_t) / thickness
        q_dot_kw = q_dot_w / 1000.0
        heat_flux = q_dot_w / area

        return {
            "heat_transfer_rate_w": q_dot_w,
            "heat_transfer_rate_kw": q_dot_kw,
            "heat_flux_w_m2": heat_flux,
            "delta_t": delta_t,
            "temperature_gradient": temp_gradient,
            "thermal_resistance": thermal_resistance,
        }

    @staticmethod
    def generate_conduction_profile(
        thickness: float, t_hot: float, t_cold: float, points_count: int = 25
    ) -> List[Dict[str, float]]:
        """
        Generates linear temperature profile data points T(x) across the wall thickness.

        Args:
            thickness: Wall thickness L in meters.
            t_hot: Hot face temperature in °C at x = 0.
            t_cold: Cold face temperature in °C at x = L.
            points_count: Number of spatial points along the wall.

        Returns:
            List of dictionaries with position_m, position_mm, and temperature_c.
        """
        step = thickness / max(points_count - 1, 1)
        points: List[Dict[str, float]] = []
        for i in range(points_count):
            x = i * step
            # Linear temperature distribution in 1D steady-state plane wall: T(x) = T_hot - (delta_t / L) * x
            t_x = t_hot - ((t_hot - t_cold) / thickness) * x
            points.append({
                "position_m": x,
                "position_mm": x * 1000.0,
                "temperature_c": t_x,
            })
        return points

    @staticmethod
    def calculate_cooling(
        t_initial: float, t_ambient: float, t_target: float, cooling_constant: float
    ) -> Dict[str, Any]:
        """
        Calculates time required to reach target temperature according to Newton's Law of Cooling:
        T(t) = T_ambient + (T0 - T_ambient) * exp(-k * t)
        t = -1/k * ln( (T_target - T_ambient) / (T0 - T_ambient) )

        Args:
            t_initial: Initial body temperature T0 in °C.
            t_ambient: Ambient surrounding fluid temperature T_ambient in °C.
            t_target: Target desired body temperature in °C.
            cooling_constant: Cooling rate constant k in 1/min (must be > 0).

        Returns:
            Dictionary containing:
                - time_min (float, NaN if unachievable)
                - time_sec (float, NaN if unachievable)
                - is_cooling (bool)
                - is_achievable (bool)
                - explanation (str)

        Raises:
            ValueError: If cooling_constant <= 0.
        """
        if cooling_constant <= 0:
            raise ValueError(f"Cooling constant k must be greater than zero (1/min), received: {cooling_constant}")

        is_cooling = t_initial > t_ambient

        # Case 1: Initial already equal to ambient
        if abs(t_initial - t_ambient) < 1e-6:
            return {
                "time_min": 0.0,
                "time_sec": 0.0,
                "is_cooling": is_cooling,
                "is_achievable": True,
                "explanation": "Initial temperature is already at ambient equilibrium.",
            }

        # Case 2: Cooling process (T0 > T_ambient)
        if is_cooling:
            if t_target >= t_initial:
                return {
                    "time_min": float("nan"),
                    "time_sec": float("nan"),
                    "is_cooling": True,
                    "is_achievable": False,
                    "explanation": f"Target temperature ({t_target:.1f}°C) must be lower than initial temp ({t_initial:.1f}°C) during cooling.",
                }
            if t_target <= t_ambient:
                return {
                    "time_min": float("nan"),
                    "time_sec": float("nan"),
                    "is_cooling": True,
                    "is_achievable": False,
                    "explanation": f"Target temperature ({t_target:.1f}°C) cannot reach or drop below ambient ({t_ambient:.1f}°C) in finite time.",
                }
        # Case 3: Heating process (T0 < T_ambient)
        else:
            if t_target <= t_initial:
                return {
                    "time_min": float("nan"),
                    "time_sec": float("nan"),
                    "is_cooling": False,
                    "is_achievable": False,
                    "explanation": f"Target temperature ({t_target:.1f}°C) must be higher than initial temp ({t_initial:.1f}°C) during ambient warming.",
                }
            if t_target >= t_ambient:
                return {
                    "time_min": float("nan"),
                    "time_sec": float("nan"),
                    "is_cooling": False,
                    "is_achievable": False,
                    "explanation": f"Target temperature ({t_target:.1f}°C) cannot reach or exceed ambient ({t_ambient:.1f}°C) in finite time.",
                }

        # Valid analytical logarithmic solution
        ratio = (t_target - t_ambient) / (t_initial - t_ambient)
        time_min = -math.log(ratio) / cooling_constant
        time_sec = time_min * 60.0

        explanation = (
            f"Cooling from {t_initial:.1f}°C to {t_target:.1f}°C in {t_ambient:.1f}°C ambient environment."
            if is_cooling
            else f"Heating from {t_initial:.1f}°C to {t_target:.1f}°C in {t_ambient:.1f}°C ambient environment."
        )

        return {
            "time_min": time_min,
            "time_sec": time_sec,
            "is_cooling": is_cooling,
            "is_achievable": True,
            "explanation": explanation,
        }

    @staticmethod
    def generate_cooling_curve(
        t_initial: float, t_ambient: float, t_target: float, cooling_constant: float, points_count: int = 50
    ) -> List[Dict[str, float]]:
        """
        Generates time vs. temperature curve points T(t) for plotting Newton's Law of Cooling.

        Args:
            t_initial: Initial temperature in °C.
            t_ambient: Ambient temperature in °C.
            t_target: Target temperature in °C.
            cooling_constant: Rate constant k in 1/min.
            points_count: Number of temporal points to generate.

        Returns:
            List of dictionaries with time_min, temperature_c, ambient_temp_c, and target_temp_c.
        """
        res = HeatTransferCalculator.calculate_cooling(t_initial, t_ambient, t_target, cooling_constant)

        if res["is_achievable"] and not math.isnan(res["time_min"]):
            max_time = max(res["time_min"] * 1.8, 10.0)
        else:
            # 4 time constants (98% approach to ambient)
            tau = 1.0 / cooling_constant
            max_time = max(tau * 4.0, 15.0)

        step = max_time / max(points_count - 1, 1)
        points: List[Dict[str, float]] = []

        for i in range(points_count):
            t = i * step
            temp = t_ambient + (t_initial - t_ambient) * math.exp(-cooling_constant * t)
            points.append({
                "time_min": t,
                "temperature_c": temp,
                "ambient_temp_c": t_ambient,
                "target_temp_c": t_target,
            })

        return points


# ==============================================================================
# CLASS 4: ROCK & FLUID DATA ANALYZER
# ==============================================================================

class RockFluidAnalyzer:
    """
    Provides data analysis, statistical metric computation, and multi-variable filtering
    for petroleum core analysis, PVT test reports, and geoscience datasets.
    """

    @staticmethod
    def compute_column_statistics(values: List[float], col_name: str) -> Dict[str, Any]:
        """
        Computes 5-number summary statistics and sample moments for a list of numeric values.

        Args:
            values: List of numeric float values.
            col_name: Name of the column.

        Returns:
            Dictionary containing count, mean, std, min, p25, median, p75, max.
        """
        clean_vals = [float(v) for v in values if v is not None and not math.isnan(float(v)) and not math.isinf(float(v))]
        if not clean_vals:
            return {
                "column": col_name,
                "count": 0,
                "mean": 0.0,
                "std": 0.0,
                "min": 0.0,
                "p25": 0.0,
                "median": 0.0,
                "p75": 0.0,
                "max": 0.0,
            }

        sorted_vals = sorted(clean_vals)
        n = len(sorted_vals)
        mean_val = sum(sorted_vals) / n

        variance = sum((x - mean_val) ** 2 for x in sorted_vals) / (n - 1) if n > 1 else 0.0
        std_val = math.sqrt(variance)

        def percentile(p: float) -> float:
            idx = (n - 1) * p
            low = int(math.floor(idx))
            high = int(math.ceil(idx))
            if low == high:
                return sorted_vals[low]
            weight = idx - low
            return sorted_vals[low] * (1.0 - weight) + sorted_vals[high] * weight

        return {
            "column": col_name,
            "count": n,
            "mean": mean_val,
            "std": std_val,
            "min": sorted_vals[0],
            "p25": percentile(0.25),
            "median": percentile(0.50),
            "p75": percentile(0.75),
            "max": sorted_vals[-1],
        }


# ==============================================================================
# CLASS 5: INDEPENDENT HAND-CALCULATION VERIFICATION SUITE
# ==============================================================================

class VerificationEngine:
    """
    Executes and evaluates independent textbook verification test cases
    to mathematically validate the Pipe Flow, Wall Conduction, and Newton Cooling engines.
    """

    @staticmethod
    def get_test_cases() -> List[Dict[str, Any]]:
        """
        Generates and evaluates the benchmark verification test cases against hand calculations.

        Returns:
            List of structured test case dictionaries with inputs, expected hand outputs,
            software computed outputs, tolerance percent, pass/fail status, and hand derivations.
        """
        # Case 1: Pipe Flow Verification (Water in Commercial Steel Pipe)
        # D = 0.1 m, L = 100 m, Roughness = 0.000045 m, Q = 0.02 m^3/s
        water = Fluid("Water", 998.2, 0.001002)
        pipe = Pipe(0.1, 100.0, 0.000045)
        pipe_res = pipe.analyze_flow(water, 0.02)

        # Case 2: Wall Conduction Verification (Concrete Wall)
        # Thickness = 0.2 m, Area = 10 m^2, k = 1.4 W/(m*K), Thot = 100°C, Tcold = 20°C
        cond_res = HeatTransferCalculator.calculate_conduction(
            thickness=0.2, area=10.0, thermal_conductivity=1.4, t_hot=100.0, t_cold=20.0
        )

        # Case 3: Newton's Law of Cooling Verification
        # T0 = 90°C, Tamb = 20°C, Ttarget = 50°C, k = 0.05 1/min
        cooling_res = HeatTransferCalculator.calculate_cooling(
            t_initial=90.0, t_ambient=20.0, t_target=50.0, cooling_constant=0.05
        )

        cases: List[Dict[str, Any]] = [
            {
                "id": "test_pipe_flow",
                "module": "Pipe Flow",
                "name": "Water Flow in Commercial Steel Pipe",
                "description": "Verifies velocity, Reynolds number, Colebrook friction factor, and Darcy-Weisbach pressure drop against textbook hand calculations.",
                "inputs": {
                    "Fluid": "Water (998.2 kg/m³, 0.001002 Pa·s)",
                    "Diameter (D)": "0.10 m (100 mm)",
                    "Length (L)": "100.0 m",
                    "Roughness (ε)": "0.000045 m (Steel)",
                    "Flow Rate (Q)": "0.020 m³/s (20 L/s)",
                },
                "expectedOutputs": {
                    "Area": {"value": 0.007854, "unit": "m²", "tolerancePercent": 0.5},
                    "Velocity": {"value": 2.5465, "unit": "m/s", "tolerancePercent": 0.5},
                    "Reynolds Number": {"value": 253683.0, "unit": "-", "tolerancePercent": 1.0},
                    "Friction Factor": {"value": 0.01815, "unit": "-", "tolerancePercent": 1.5},
                    "Pressure Drop": {"value": 58.74, "unit": "kPa", "tolerancePercent": 2.0},
                },
                "calculatedOutputs": {
                    "Area": pipe_res["area"],
                    "Velocity": pipe_res["velocity"],
                    "Reynolds Number": pipe_res["reynolds_number"],
                    "Friction Factor": pipe_res["friction_factor"],
                    "Pressure Drop": pipe_res["pressure_drop_kpa"],
                },
                "passed": (
                    abs(pipe_res["velocity"] - 2.5465) / 2.5465 < 0.005
                    and abs(pipe_res["pressure_drop_kpa"] - 58.74) / 58.74 < 0.02
                ),
                "handCalculationSteps": [
                    "Step 1: Cross-sectional Area A = π * D² / 4 = π * (0.1)² / 4 = 0.007854 m²",
                    "Step 2: Average Velocity V = Q / A = 0.02 / 0.007854 = 2.5465 m/s",
                    "Step 3: Reynolds Number Re = (ρ * V * D) / μ = (998.2 * 2.5465 * 0.1) / 0.001002 = 253,683 (Turbulent)",
                    "Step 4: Relative Roughness ε/D = 0.000045 / 0.1 = 0.00045",
                    "Step 5: Colebrook-White Newton-Raphson Solution => f = 0.01815",
                    "Step 6: Dynamic Pressure q = 0.5 * ρ * V² = 0.5 * 998.2 * (2.5465)² = 3,236.4 Pa",
                    "Step 7: Pressure Drop ΔP = f * (L/D) * q = 0.01815 * (100 / 0.1) * 3,236.4 = 58,741 Pa = 58.74 kPa",
                ],
            },
            {
                "id": "test_wall_conduction",
                "module": "Wall Conduction",
                "name": "1D Steady-State Concrete Wall Conduction",
                "description": "Verifies Fourier's Law heat transfer rate and heat flux through a single homogeneous plane wall.",
                "inputs": {
                    "Thickness (L)": "0.20 m (200 mm)",
                    "Area (A)": "10.0 m²",
                    "Thermal Conductivity (k)": "1.40 W/(m·K)",
                    "Hot Temp (Thot)": "100.0 °C",
                    "Cold Temp (Tcold)": "20.0 °C",
                },
                "expectedOutputs": {
                    "Heat Transfer Rate": {"value": 5.60, "unit": "kW", "tolerancePercent": 0.1},
                    "Heat Flux": {"value": 560.0, "unit": "W/m²", "tolerancePercent": 0.1},
                },
                "calculatedOutputs": {
                    "Heat Transfer Rate": cond_res["heat_transfer_rate_kw"],
                    "Heat Flux": cond_res["heat_flux_w_m2"],
                },
                "passed": (
                    abs(cond_res["heat_transfer_rate_kw"] - 5.60) < 0.001
                    and abs(cond_res["heat_flux_w_m2"] - 560.0) < 0.1
                ),
                "handCalculationSteps": [
                    "Step 1: Temperature difference ΔT = Thot - Tcold = 100 - 20 = 80 K",
                    "Step 2: Fourier's Law Q_dot = k * A * ΔT / L = (1.4 * 10 * 80) / 0.2 = 5,600 W = 5.60 kW",
                    "Step 3: Heat Flux q\" = Q_dot / A = 5,600 / 10 = 560 W/m²",
                ],
            },
            {
                "id": "test_newton_cooling",
                "module": "Newton Cooling",
                "name": "Transient Object Cooling with Newton's Law",
                "description": "Verifies analytical time to reach target temperature according to Newton's Law of Cooling.",
                "inputs": {
                    "Initial Temp (T0)": "90.0 °C",
                    "Ambient Temp (Tamb)": "20.0 °C",
                    "Target Temp (Ttarget)": "50.0 °C",
                    "Cooling Constant (k)": "0.05 1/min",
                },
                "expectedOutputs": {
                    "Time to Target": {"value": 16.946, "unit": "min", "tolerancePercent": 0.5},
                },
                "calculatedOutputs": {
                    "Time to Target": cooling_res["time_min"],
                },
                "passed": abs(cooling_res["time_min"] - 16.946) / 16.946 < 0.005,
                "handCalculationSteps": [
                    "Step 1: Dimensionless Temp Ratio = (Ttarget - Tamb) / (T0 - Tamb) = (50 - 20) / (90 - 20) = 30 / 70 = 0.428571",
                    "Step 2: Analytical Solution t = -ln(0.428571) / k = -(-0.847298) / 0.05 = 16.946 minutes",
                ],
            },
        ]

        return cases

    @staticmethod
    def run_all_tests() -> Dict[str, Any]:
        """
        Runs all verification benchmarks and summarizes global pass/fail statistics.

        Returns:
            Dictionary containing total_tests, passed_tests, all_passed bool, and test_cases list.
        """
        cases = VerificationEngine.get_test_cases()
        total = len(cases)
        passed = sum(1 for c in cases if c["passed"])
        return {
            "total_tests": total,
            "passed_tests": passed,
            "all_passed": passed == total,
            "test_cases": cases,
        }
