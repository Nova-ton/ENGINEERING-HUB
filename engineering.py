"""
ENGINEERING HUB - Python Backend Core Architecture

This module implements the core Object-Oriented engineering logic for:
1. Pipe Flow Analysis (Darcy-Weisbach & Colebrook-White iterative solution)
2. Heat Transfer Calculations (1D Wall Conduction & Newton's Law of Cooling)
3. Data Analysis for Rock & Fluid Datasets

All equations use SI units internally.
"""

import math
from typing import Dict, List, Tuple, Optional, Any


class Fluid:
    """
    Represents fluid physical properties for flow and thermodynamic calculations.
    
    Attributes:
        name (str): Identifier for the fluid.
        density (float): Fluid mass density rho in kg/m^3.
        dynamic_viscosity (float): Dynamic viscosity mu in Pa*s (kg/(m*s)).
    """

    def __init__(self, name: str, density: float, dynamic_viscosity: float):
        if density <= 0:
            raise ValueError("Fluid density must be greater than zero kg/m^3.")
        if dynamic_viscosity <= 0:
            raise ValueError("Dynamic viscosity must be greater than zero Pa*s.")
        self.name = name;
        self.density = density
        self.dynamic_viscosity = dynamic_viscosity

    @property
    def kinematic_viscosity(self) -> float:
        """Calculates kinematic viscosity nu = mu / rho (m^2/s)."""
        return self.dynamic_viscosity / self.density


class Pipe:
    """
    Represents circular pipe geometry and computes fluid flow friction and pressure drop.
    
    Attributes:
        diameter (float): Internal pipe diameter D in meters.
        length (float): Pipe length L in meters.
        roughness (float): Absolute surface roughness epsilon in meters.
    """

    def __init__(self, diameter: float, length: float, roughness: float):
        if diameter <= 0:
            raise ValueError("Pipe internal diameter must be greater than zero meters.")
        if length < 0:
            raise ValueError("Pipe length cannot be negative.")
        if roughness < 0:
            raise ValueError("Pipe roughness cannot be negative.")
        if roughness >= diameter:
            raise ValueError("Pipe roughness must be strictly smaller than pipe internal diameter.")
            
        self.diameter = diameter
        self.length = length
        self.roughness = roughness

    @property
    def area(self) -> float:
        """Cross-sectional flow area A = pi * D^2 / 4 (m^2)."""
        return (math.pi * self.diameter ** 2) / 4.0

    @property
    def relative_roughness(self) -> float:
        """Relative roughness epsilon / D (dimensionless)."""
        return self.roughness / self.diameter

    def calculate_velocity(self, flow_rate: float) -> float:
        """Calculates average flow velocity V = Q / A (m/s)."""
        if flow_rate < 0:
            raise ValueError("Volumetric flow rate cannot be negative.")
        return flow_rate / self.area

    def calculate_reynolds_number(self, fluid: Fluid, velocity: float) -> float:
        """Calculates Reynolds Number Re = rho * V * D / mu (dimensionless)."""
        return (fluid.density * velocity * self.diameter) / fluid.dynamic_viscosity

    @staticmethod
    def classify_regime(re: float) -> str:
        """Classifies flow regime into Laminar, Transitional, or Turbulent."""
        if re < 2300:
            return "Laminar"
        elif re < 4000:
            return "Transitional"
        else:
            return "Turbulent"

    @staticmethod
    def calculate_haaland_friction_factor(re: float, rel_roughness: float) -> float:
        """Computes Haaland explicit approximation for Darcy friction factor."""
        if re <= 0:
            return 0.0
        if re < 2300:
            return 64.0 / re
        term = math.pow(rel_roughness / 3.7, 1.11) + (6.9 / re)
        inv_sqrt_f = -1.8 * math.log10(term)
        return (1.0 / inv_sqrt_f) ** 2

    @staticmethod
    def calculate_swamee_jain_friction_factor(re: float, rel_roughness: float) -> float:
        """Computes Swamee-Jain explicit approximation for Darcy friction factor."""
        if re <= 0:
            return 0.0
        if re < 2300:
            return 64.0 / re
        denom = math.log10((rel_roughness / 3.7) + (5.74 / (re ** 0.9)))
        return 0.25 / (denom ** 2)

    @classmethod
    def calculate_colebrook_friction_factor(cls, re: float, rel_roughness: float) -> float:
        """
        Solves Colebrook-White implicit equation for Darcy friction factor f via Newton-Raphson iteration.
        1/sqrt(f) = -2 * log10( (roughness / 3.7D) + (2.51 / (Re * sqrt(f))) )
        """
        if re <= 0:
            return 0.0
        if re < 2300:
            return 64.0 / re
        if 2300 <= re < 4000:
            # Transitional regime interpolation
            f_lam = 64.0 / 2300.0
            f_turb_4000 = cls._solve_colebrook_newton(4000.0, rel_roughness)
            factor = (re - 2300.0) / (4000.0 - 2300.0)
            return f_lam + factor * (f_turb_4000 - f_lam)
            
        return cls._solve_colebrook_newton(re, rel_roughness)

    @staticmethod
    def _solve_colebrook_newton(re: float, rel_roughness: float) -> float:
        """Newton-Raphson iterative solver for Colebrook-White equation."""
        f = Pipe.calculate_haaland_friction_factor(re, rel_roughness)
        for _ in range(100):
            if f <= 0:
                f = 0.02
            sqrt_f = math.sqrt(f)
            arg = (rel_roughness / 3.7) + (2.51 / (re * sqrt_f))
            g = (1.0 / sqrt_f) + 2.0 * math.log10(arg)
            
            if abs(g) < 1e-8:
                return f
                
            dg = (-0.5 / (f * sqrt_f)) + (2.0 / (arg * math.log(10))) * (-2.51 / (2.0 * re * f * sqrt_f))
            next_f = f - (g / dg)
            if abs(next_f - f) < 1e-8:
                return max(next_f, 0.001)
            f = max(next_f, 0.001)
        return f

    def analyze_flow(self, fluid: Fluid, flow_rate: float) -> Dict[str, Any]:
        """
        Computes complete pipe flow hydraulic characteristics.
        
        Returns:
            Dictionary containing velocity, Reynolds number, friction factors, and pressure drop.
        """
        if flow_rate == 0:
            return {
                "area": self.area,
                "velocity": 0.0,
                "reynolds_number": 0.0,
                "regime": "Laminar",
                "friction_factor": 0.0,
                "pressure_drop_pa": 0.0,
                "pressure_drop_kpa": 0.0,
                "method_used": "Zero Flow",
            }
            
        velocity = self.calculate_velocity(flow_rate)
        re = self.calculate_reynolds_number(fluid, velocity)
        regime = self.classify_regime(re)
        rel_rough = self.relative_roughness

        f_colebrook = self.calculate_colebrook_friction_factor(re, rel_rough)
        
        dynamic_pressure = 0.5 * fluid.density * (velocity ** 2)
        pressure_drop_pa = f_colebrook * (self.length / self.diameter) * dynamic_pressure if self.length > 0 else 0.0
        
        return {
            "area": self.area,
            "velocity": velocity,
            "reynolds_number": re,
            "regime": regime,
            "friction_factor": f_colebrook,
            "pressure_drop_pa": pressure_drop_pa,
            "pressure_drop_kpa": pressure_drop_pa / 1000.0,
            "dynamic_pressure": dynamic_pressure,
            "relative_roughness": rel_rough,
            "method_used": "Colebrook-White (Newton-Raphson)" if regime != "Laminar" else "f = 64/Re",
        }


class HeatTransferCalculator:
    """
    Handles steady-state 1D wall conduction and transient Newton's Law of Cooling calculations.
    """

    @staticmethod
    def calculate_conduction(
        thickness: float, area: float, thermal_conductivity: float, t_hot: float, t_cold: float
    ) -> Dict[str, float]:
        """
        Computes steady-state wall conduction heat transfer rate using Fourier's Law.
        Q_dot = k * A * (T_hot - T_cold) / L
        """
        if thickness <= 0:
            raise ValueError("Wall thickness must be greater than zero meters.")
        if area <= 0:
            raise ValueError("Wall area must be greater than zero m^2.")
        if thermal_conductivity <= 0:
            raise ValueError("Thermal conductivity must be greater than zero W/(m*K).")

        delta_t = t_hot - t_cold
        q_dot_w = (thermal_conductivity * area * delta_t) / thickness
        q_flux = q_dot_w / area
        
        return {
            "heat_transfer_rate_w": q_dot_w,
            "heat_transfer_rate_kw": q_dot_w / 1000.0,
            "heat_flux_w_m2": q_flux,
            "delta_t": delta_t,
            "temperature_gradient": delta_t / thickness,
        }

    @staticmethod
    def calculate_cooling(
        t_initial: float, t_ambient: float, t_target: float, cooling_constant: float
    ) -> Dict[str, Any]:
        """
        Computes time to target temperature using Newton's Law of Cooling analytical solution.
        t = -1/k * ln( (T_target - T_ambient) / (T0 - T_ambient) )
        """
        if cooling_constant <= 0:
            raise ValueError("Cooling constant k must be greater than zero.")

        is_cooling = t_initial > t_ambient

        if abs(t_initial - t_ambient) < 1e-6:
            return {"time_min": 0.0, "is_achievable": True, "explanation": "Initial temp equals ambient."}

        if is_cooling:
            if t_target >= t_initial:
                return {
                    "time_min": float("nan"),
                    "is_achievable": False,
                    "explanation": f"Target temperature ({t_target}°C) must be less than initial temp ({t_initial}°C) for cooling.",
                }
            if t_target <= t_ambient:
                return {
                    "time_min": float("nan"),
                    "is_achievable": False,
                    "explanation": f"Target temperature ({t_target}°C) cannot drop to or below ambient ({t_ambient}°C).",
                }
        else:
            if t_target <= t_initial:
                return {
                    "time_min": float("nan"),
                    "is_achievable": False,
                    "explanation": f"Target temperature ({t_target}°C) must be greater than initial temp ({t_initial}°C) for heating.",
                }
            if t_target >= t_ambient:
                return {
                    "time_min": float("nan"),
                    "is_achievable": False,
                    "explanation": f"Target temperature ({t_target}°C) cannot reach or exceed ambient ({t_ambient}°C) during ambient heating.",
                }

        ratio = (t_target - t_ambient) / (t_initial - t_ambient)
        time_min = -math.log(ratio) / cooling_constant

        return {
            "time_min": time_min,
            "time_sec": time_min * 60.0,
            "is_achievable": True,
            "explanation": "Valid analytical solution computed.",
        }
