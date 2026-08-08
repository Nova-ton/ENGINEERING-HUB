/**
 * ENGINEERING HUB - CORE ENGINEERING CALCULATIONS & OBJECT MODELS
 * 
 * Provides object-oriented engineering logic, robust input validation,
 * exact numerical algorithms (e.g. Colebrook-White iterative solver),
 * analytical heat transfer equations, and verification test logic.
 */

import {
  FluidProperties,
  FlowRegime,
  PipeFlowInputs,
  PipeFlowResults,
  PipeFlowPlotPoint,
  ConductionInputs,
  ConductionResults,
  CoolingInputs,
  CoolingResults,
  CoolingPlotPoint,
  VerificationTestCase,
} from '../types';

// Standard Fluid Preset Database
export const PRESET_FLUIDS: FluidProperties[] = [
  {
    id: 'water',
    name: 'Water (20°C, 1 atm)',
    density: 998.2, // kg/m³
    dynamicViscosity: 0.001002, // Pa·s
    description: 'Standard fresh water at standard laboratory conditions.',
  },
  {
    id: 'air',
    name: 'Air (20°C, 1 atm)',
    density: 1.204, // kg/m³
    dynamicViscosity: 0.00001813, // Pa·s
    description: 'Dry air at standard room temperature and atmospheric pressure.',
  },
  {
    id: 'crude_oil',
    name: 'Medium Crude Oil (15°C)',
    density: 850.0, // kg/m³
    dynamicViscosity: 0.015, // Pa·s
    description: 'Typical medium crude oil at standard surface conditions.',
  },
  {
    id: 'custom',
    name: 'User-defined Fluid',
    density: 1000.0,
    dynamicViscosity: 0.001,
    description: 'Manually specify custom density and dynamic viscosity values.',
  },
];

// Standard Pipe Roughness Presets (in meters)
export const PIPE_ROUGHNESS_PRESETS = [
  { name: 'Commercial Steel / Wrought Iron', value: 0.000045, label: '0.045 mm' },
  { name: 'Drawn Tubing / Smooth Brass / Glass', value: 0.0000015, label: '0.0015 mm' },
  { name: 'Cast Iron (Unlined)', value: 0.00026, label: '0.26 mm' },
  { name: 'Galvanized Iron', value: 0.00015, label: '0.15 mm' },
  { name: 'Concrete (Smooth)', value: 0.0003, label: '0.30 mm' },
  { name: 'Riveted Steel', value: 0.0009, label: '0.90 mm' },
];

// Standard Thermal Conductivity Presets (in W/(m·K))
export const MATERIAL_THERMAL_CONDUCTIVITY_PRESETS = [
  { name: 'Copper (Pure)', value: 385.0 },
  { name: 'Aluminum (1100)', value: 205.0 },
  { name: 'Carbon Steel (Structural)', value: 50.0 },
  { name: 'Stainless Steel (304)', value: 16.2 },
  { name: 'Concrete (Dense)', value: 1.4 },
  { name: 'Red Brick', value: 0.72 },
  { name: 'Glass (Window)', value: 0.8 },
  { name: 'Pine / Soft Wood', value: 0.13 },
  { name: 'Fiberglass Thermal Insulation', value: 0.04 },
  { name: 'Mineral Wool Insulation', value: 0.038 },
];

/**
 * Class representing a Fluid in engineering calculations.
 */
export class Fluid {
  readonly name: string;
  readonly density: number; // kg/m³
  readonly dynamicViscosity: number; // Pa·s

  constructor(name: string, density: number, dynamicViscosity: number) {
    if (density <= 0) {
      throw new Error('Fluid density must be greater than zero kg/m³.');
    }
    if (dynamicViscosity <= 0) {
      throw new Error('Fluid dynamic viscosity must be greater than zero Pa·s.');
    }
    this.name = name;
    this.density = density;
    this.dynamicViscosity = dynamicViscosity;
  }

  /**
   * Kinematic viscosity nu = mu / rho (m²/s)
   */
  get kinematicViscosity(): number {
    return this.dynamicViscosity / this.density;
  }
}

/**
 * Class representing Pipe Geometry & Flow Analysis
 */
export class Pipe {
  readonly diameter: number; // m
  readonly length: number; // m
  readonly roughness: number; // m

  constructor(diameter: number, length: number, roughness: number) {
    if (diameter <= 0) {
      throw new Error('Pipe internal diameter must be greater than zero meters.');
    }
    if (length < 0) {
      throw new Error('Pipe length cannot be negative.');
    }
    if (roughness < 0) {
      throw new Error('Pipe roughness cannot be negative.');
    }
    if (roughness >= diameter) {
      throw new Error('Pipe roughness must be smaller than the internal diameter.');
    }
    this.diameter = diameter;
    this.length = length;
    this.roughness = roughness;
  }

  /**
   * Cross-sectional flow area A = pi * D² / 4 (m²)
   */
  get area(): number {
    return (Math.PI * Math.pow(this.diameter, 2)) / 4;
  }

  /**
   * Relative roughness epsilon / D
   */
  get relativeRoughness(): number {
    return this.roughness / this.diameter;
  }

  /**
   * Calculates flow velocity V = Q / A (m/s)
   */
  calculateVelocity(flowRate: number): number {
    if (flowRate < 0) {
      throw new Error('Volumetric flow rate cannot be negative.');
    }
    return flowRate / this.area;
  }

  /**
   * Calculates Reynolds Number Re = rho * V * D / mu
   */
  calculateReynoldsNumber(fluid: Fluid, velocity: number): number {
    return (fluid.density * velocity * this.diameter) / fluid.dynamicViscosity;
  }

  /**
   * Classifies flow regime based on Reynolds number
   */
  static classifyRegime(re: number): FlowRegime {
    if (re < 2300) return 'Laminar';
    if (re < 4000) return 'Transitional';
    return 'Turbulent';
  }

  /**
   * Solves Haaland explicit approximation for Darcy friction factor f
   */
  static calculateHaalandFrictionFactor(re: number, relRoughness: number): number {
    if (re <= 0) return 0;
    if (re < 2300) return 64 / re;
    const term = Math.pow(relRoughness / 3.7, 1.11) + 6.9 / re;
    const invSqrtF = -1.8 * Math.log10(term);
    return Math.pow(1 / invSqrtF, 2);
  }

  /**
   * Solves Swamee-Jain explicit approximation for Darcy friction factor f
   */
  static calculateSwameeJainFrictionFactor(re: number, relRoughness: number): number {
    if (re <= 0) return 0;
    if (re < 2300) return 64 / re;
    const denominator = Math.log10(relRoughness / 3.7 + 5.74 / Math.pow(re, 0.9));
    return 0.25 / Math.pow(denominator, 2);
  }

  /**
   * Solves Colebrook-White implicit equation for Darcy friction factor f using Newton-Raphson iteration.
   * 1 / sqrt(f) = -2 * log10( (roughness / (3.7 * D)) + (2.51 / (Re * sqrt(f))) )
   */
  static calculateColebrookFrictionFactor(re: number, relRoughness: number): number {
    if (re <= 0) return 0;

    // Laminar Regime
    if (re < 2300) {
      return 64 / re;
    }

    // Transitional Regime (Weighted blend between laminar at 2300 and turbulent at 4000)
    if (re >= 2300 && re < 4000) {
      const fLaminar = 64 / 2300;
      const fTurbulent4000 = Pipe.solveColebrookNewtonRaphson(4000, relRoughness);
      const factor = (re - 2300) / (4000 - 2300);
      return fLaminar + factor * (fTurbulent4000 - fLaminar);
    }

    // Turbulent Regime
    return Pipe.solveColebrookNewtonRaphson(re, relRoughness);
  }

  private static solveColebrookNewtonRaphson(re: number, relRoughness: number): number {
    // Initial guess from Haaland equation
    let f = Pipe.calculateHaalandFrictionFactor(re, relRoughness);
    const maxIterations = 100;
    const tolerance = 1e-8;

    for (let i = 0; i < maxIterations; i++) {
      if (f <= 0) f = 0.02; // Guard
      const sqrtF = Math.sqrt(f);
      const arg = relRoughness / 3.7 + 2.51 / (re * sqrtF);
      
      // Objective function g(f) = 1/sqrt(f) + 2*log10(arg)
      const g = 1 / sqrtF + 2 * Math.log10(arg);

      if (Math.abs(g) < tolerance) {
        return f;
      }

      // Derivative dg/df
      // d/df (1/sqrt(f)) = -1/(2*f^(3/2))
      // d/df (2*log10(arg)) = 2 / (arg * ln(10)) * (-2.51 / (2 * Re * f^(3/2)))
      const dg =
        -0.5 / (f * sqrtF) +
        (2 / (arg * Math.LN10)) * (-2.51 / (2 * re * f * sqrtF));

      const nextF = f - g / dg;
      
      if (Math.abs(nextF - f) < tolerance) {
        return Math.max(nextF, 0.001);
      }
      f = Math.max(nextF, 0.001); // Prevent zero/negative
    }

    return f;
  }

  /**
   * Computes comprehensive pipe flow analysis
   */
  analyzeFlow(fluid: Fluid, flowRate: number): PipeFlowResults {
    const warnings: string[] = [];

    if (flowRate === 0) {
      return {
        area: this.area,
        velocity: 0,
        reynoldsNumber: 0,
        regime: 'Laminar',
        frictionFactor: 0,
        swameeJainFrictionFactor: 0,
        haalandFrictionFactor: 0,
        pressureDropPa: 0,
        pressureDropKPa: 0,
        pressureDropBar: 0,
        pressureDropPsi: 0,
        dynamicPressure: 0,
        relativeRoughness: this.relativeRoughness,
        headLoss: 0,
        frictionFactorMethod: 'Zero Flow',
        warnings: ['Flow rate is zero. No velocity or pressure loss calculated.'],
      };
    }

    const velocity = this.calculateVelocity(flowRate);
    const re = this.calculateReynoldsNumber(fluid, velocity);
    const regime = Pipe.classifyRegime(re);
    const relRough = this.relativeRoughness;

    const fColebrook = Pipe.calculateColebrookFrictionFactor(re, relRough);
    const fSwamee = Pipe.calculateSwameeJainFrictionFactor(re, relRough);
    const fHaaland = Pipe.calculateHaalandFrictionFactor(re, relRough);

    let methodUsed = 'Colebrook-White (Newton-Raphson Solution)';
    if (regime === 'Laminar') {
      methodUsed = 'Laminar Exact Equation (f = 64 / Re)';
    } else if (regime === 'Transitional') {
      methodUsed = 'Transitional Linear Interpolation (2300 ≤ Re < 4000)';
      warnings.push(
        'Flow is in the transitional regime (2300 ≤ Re < 4000). Flow may oscillate unpredictably between laminar and turbulent states.'
      );
    }

    if (velocity > 15 && fluid.density > 100) {
      warnings.push(
        `High liquid velocity detected (${velocity.toFixed(2)} m/s). May cause severe erosion and water hammer.`
      );
    }

    // Darcy-Weisbach Pressure Drop: deltaP = f * (L / D) * (rho * V^2 / 2)
    const dynamicPressure = 0.5 * fluid.density * Math.pow(velocity, 2);
    const pressureDropPa = this.length > 0 ? fColebrook * (this.length / this.diameter) * dynamicPressure : 0;
    const pressureDropKPa = pressureDropPa / 1000;
    const pressureDropBar = pressureDropPa / 100000;
    const pressureDropPsi = pressureDropPa / 6894.76;
    const headLoss = pressureDropPa / (fluid.density * 9.81);

    return {
      area: this.area,
      velocity,
      reynoldsNumber: re,
      regime,
      frictionFactor: fColebrook,
      swameeJainFrictionFactor: fSwamee,
      haalandFrictionFactor: fHaaland,
      pressureDropPa,
      pressureDropKPa,
      pressureDropBar,
      pressureDropPsi,
      dynamicPressure,
      relativeRoughness: relRough,
      headLoss,
      frictionFactorMethod: methodUsed,
      warnings,
    };
  }

  /**
   * Generates interactive curve data (Pressure Drop vs Flow Rate)
   */
  generatePressureDropCurve(fluid: Fluid, operatingFlowRate: number, pointsCount = 30): PipeFlowPlotPoint[] {
    const safeQ = Math.max(operatingFlowRate, 0.0001);
    const minQ = safeQ * 0.1;
    const maxQ = safeQ * 2.2;
    const step = (maxQ - minQ) / (pointsCount - 1);

    const plotPoints: PipeFlowPlotPoint[] = [];

    // Include exact operating point
    const flowRatesToTest: number[] = [];
    for (let i = 0; i < pointsCount; i++) {
      flowRatesToTest.push(minQ + i * step);
    }
    // Insert exact operating flow rate if not already present
    if (!flowRatesToTest.some((q) => Math.abs(q - safeQ) < step * 0.1)) {
      flowRatesToTest.push(safeQ);
      flowRatesToTest.sort((a, b) => a - b);
    }

    for (const q of flowRatesToTest) {
      const res = this.analyzeFlow(fluid, q);
      const isOperatingPoint = Math.abs(q - safeQ) < 1e-7;
      plotPoints.push({
        flowRate: q,
        flowRateLps: q * 1000,
        velocity: res.velocity,
        reynoldsNumber: res.reynoldsNumber,
        frictionFactor: res.frictionFactor,
        pressureDropKPa: res.pressureDropKPa,
        regime: res.regime,
        isOperatingPoint,
      });
    }

    return plotPoints;
  }
}

/**
 * Class representing Heat Transfer Analysis (Conduction & Newton's Law of Cooling)
 */
export class HeatTransferCalculator {
  /**
   * Calculates steady-state 1D wall conduction heat transfer rate Q_dot = k * A * (T_hot - T_cold) / L
   */
  static calculateConduction(inputs: ConductionInputs): ConductionResults {
    const { thickness, area, thermalConductivity, tHot, tCold } = inputs;

    if (thickness <= 0) {
      throw new Error('Wall thickness must be greater than zero meters.');
    }
    if (area <= 0) {
      throw new Error('Wall surface area must be greater than zero m².');
    }
    if (thermalConductivity <= 0) {
      throw new Error('Thermal conductivity must be greater than zero W/(m·K).');
    }

    const deltaT = tHot - tCold;
    const tempGradient = deltaT / thickness; // K/m
    const thermalResistance = thickness / (thermalConductivity * area); // K/W

    const heatTransferRateW = (thermalConductivity * area * deltaT) / thickness;
    const heatTransferRateKW = heatTransferRateW / 1000;
    const heatFlux = heatTransferRateW / area; // W/m²

    return {
      heatTransferRateW,
      heatTransferRateKW,
      heatFlux,
      tempGradient,
      deltaT,
      thermalResistance,
    };
  }

  /**
   * Calculates transient cooling/heating according to Newton's Law of Cooling
   * T(t) = T_ambient + (T0 - T_ambient) * exp(-k * t)
   * Time to target: t = -1/k * ln( (T_target - T_ambient) / (T0 - T_ambient) )
   */
  static calculateCooling(inputs: CoolingInputs): CoolingResults {
    const { tInitial, tAmbient, tTarget, coolingConstant } = inputs;

    if (coolingConstant <= 0) {
      throw new Error('Cooling constant k must be greater than zero (1/min).');
    }

    const isCooling = tInitial > tAmbient;

    // Physical validity checks
    if (Math.abs(tInitial - tAmbient) < 1e-6) {
      return {
        timeToTargetMin: 0,
        timeToTargetSec: 0,
        isCooling,
        isAchievable: true,
        explanation: 'Initial temperature is already equal to ambient temperature.',
      };
    }

    // Check if target is between T0 and T_ambient
    let isAchievable = false;
    let explanation = '';

    if (isCooling) {
      if (tTarget >= tInitial) {
        explanation = `Target temperature (${tTarget}°C) must be lower than initial temperature (${tInitial}°C) for cooling.`;
      } else if (tTarget <= tAmbient) {
        explanation = `Target temperature (${tTarget}°C) cannot reach or drop below ambient temperature (${tAmbient}°C) in finite time.`;
      } else {
        isAchievable = true;
      }
    } else {
      // Heating process (T0 < T_ambient)
      if (tTarget <= tInitial) {
        explanation = `Target temperature (${tTarget}°C) must be higher than initial temperature (${tInitial}°C) during ambient heating.`;
      } else if (tTarget >= tAmbient) {
        explanation = `Target temperature (${tTarget}°C) cannot reach or exceed ambient temperature (${tAmbient}°C) during ambient heating.`;
      } else {
        isAchievable = true;
      }
    }

    if (!isAchievable) {
      return {
        timeToTargetMin: NaN,
        timeToTargetSec: NaN,
        isCooling,
        isAchievable: false,
        explanation,
      };
    }

    // Analytical solution for time
    const ratio = (tTarget - tAmbient) / (tInitial - tAmbient);
    const timeToTargetMin = -Math.log(ratio) / coolingConstant;
    const timeToTargetSec = timeToTargetMin * 60;

    return {
      timeToTargetMin,
      timeToTargetSec,
      isCooling,
      isAchievable: true,
      explanation: isCooling
        ? `Cooling from ${tInitial}°C to ${tTarget}°C in ambient air of ${tAmbient}°C.`
        : `Heating from ${tInitial}°C to ${tTarget}°C in ambient air of ${tAmbient}°C.`,
    };
  }

  /**
   * Generates temperature curve points T(t) over time
   */
  generateCoolingCurve(inputs: CoolingInputs, pointsCount = 40): CoolingPlotPoint[] {
    const { tInitial, tAmbient, tTarget, coolingConstant } = inputs;
    const res = HeatTransferCalculator.calculateCooling(inputs);

    let maxTime = 60; // default 60 min
    if (res.isAchievable && !isNaN(res.timeToTargetMin)) {
      maxTime = Math.max(res.timeToTargetMin * 1.8, 10);
    } else {
      // time constant tau = 1/k
      const tau = 1 / coolingConstant;
      maxTime = tau * 4; // 4 time constants ~98% change
    }

    const step = maxTime / (pointsCount - 1);
    const points: CoolingPlotPoint[] = [];

    for (let i = 0; i < pointsCount; i++) {
      const t = i * step;
      const temp = tAmbient + (tInitial - tAmbient) * Math.exp(-coolingConstant * t);
      points.push({
        timeMin: t,
        temperature: temp,
        ambientTemp: tAmbient,
        targetTemp: tTarget,
      });
    }

    return points;
  }
}

/**
 * Verification Engine for running hand-calculation test cases and comparing software outputs.
 */
export class VerificationEngine {
  static getTestCases(): VerificationTestCase[] {
    // 1. Pipe Flow Verification Case: Water flow in steel pipe
    // Given: Water at 20°C (rho = 998.2 kg/m³, mu = 0.001002 Pa·s)
    // D = 0.1 m, L = 100 m, Roughness = 0.000045 m, Q = 0.02 m³/s (20 L/s)
    // Hand Calculations:
    // A = pi * (0.1)^2 / 4 = 0.00785398 m²
    // V = 0.02 / 0.00785398 = 2.54648 m/s
    // Re = 998.2 * 2.54648 * 0.1 / 0.001002 = 253683 (Turbulent)
    // relRoughness = 0.000045 / 0.1 = 0.00045
    // Colebrook f approx 0.01815
    // dynamic pressure q = 0.5 * 998.2 * (2.54648)^2 = 3236.42 Pa
    // deltaP = 0.01815 * (100 / 0.1) * 3236.42 = 58741 Pa = 58.74 kPa
    const pipeFluid = new Fluid('Water', 998.2, 0.001002);
    const pipe = new Pipe(0.1, 100, 0.000045);
    const pipeRes = pipe.analyzeFlow(pipeFluid, 0.02);

    // 2. Wall Conduction Verification Case:
    // Thickness = 0.2 m, Area = 10 m², k = 1.4 W/(m·K), Thot = 100°C, Tcold = 20°C
    // Hand Calculations:
    // Q_dot = 1.4 * 10 * (100 - 20) / 0.2 = 5600 W = 5.6 kW
    // Flux = 5600 / 10 = 560 W/m²
    const condInputs: ConductionInputs = {
      thickness: 0.2,
      area: 10,
      thermalConductivity: 1.4,
      tHot: 100,
      tCold: 20,
    };
    const condRes = HeatTransferCalculator.calculateConduction(condInputs);

    // 3. Newton Cooling Verification Case:
    // T0 = 90°C, Tambient = 20°C, Ttarget = 50°C, k = 0.05 1/min
    // Hand Calculations:
    // ratio = (50 - 20) / (90 - 20) = 30 / 70 = 0.428571
    // t = -ln(0.428571) / 0.05 = -(-0.847298) / 0.05 = 16.946 min
    const coolingInputs: CoolingInputs = {
      tInitial: 90,
      tAmbient: 20,
      tTarget: 50,
      coolingConstant: 0.05,
    };
    const coolingRes = HeatTransferCalculator.calculateCooling(coolingInputs);

    return [
      {
        id: 'test_pipe_flow',
        module: 'Pipe Flow',
        name: 'Water Flow in Commercial Steel Pipe',
        description:
          'Verifies cross-sectional area, average velocity, Reynolds number, Colebrook friction factor, and Darcy-Weisbach pressure drop against textbook hand calculations.',
        inputs: {
          Fluid: 'Water (998.2 kg/m³, 0.001002 Pa·s)',
          Diameter: '0.1 m',
          Length: '100 m',
          Roughness: '0.000045 m (Steel)',
          'Flow Rate': '0.02 m³/s',
        },
        expectedOutputs: {
          Area: { value: 0.007854, unit: 'm²', tolerancePercent: 0.5 },
          Velocity: { value: 2.5465, unit: 'm/s', tolerancePercent: 0.5 },
          'Reynolds Number': { value: 253683, unit: '-', tolerancePercent: 1.0 },
          'Friction Factor': { value: 0.01815, unit: '-', tolerancePercent: 1.5 },
          'Pressure Drop': { value: 58.74, unit: 'kPa', tolerancePercent: 2.0 },
        },
        calculatedOutputs: {
          Area: pipeRes.area,
          Velocity: pipeRes.velocity,
          'Reynolds Number': pipeRes.reynoldsNumber,
          'Friction Factor': pipeRes.frictionFactor,
          'Pressure Drop': pipeRes.pressureDropKPa,
        },
        passed:
          Math.abs(pipeRes.velocity - 2.5465) / 2.5465 < 0.005 &&
          Math.abs(pipeRes.pressureDropKPa - 58.74) / 58.74 < 0.02,
        handCalculationSteps: [
          'Step 1: Cross-sectional Area A = π * D² / 4 = π * (0.1)² / 4 = 0.007854 m²',
          'Step 2: Average Velocity V = Q / A = 0.02 / 0.007854 = 2.5465 m/s',
          'Step 3: Reynolds Number Re = ρVD / μ = (998.2 * 2.5465 * 0.1) / 0.001002 = 253,683 (Turbulent)',
          'Step 4: Relative Roughness ε/D = 0.000045 / 0.1 = 0.00045',
          'Step 5: Colebrook-White Newton-Raphson Solution => f = 0.01815',
          'Step 6: Dynamic Pressure q = 0.5 * ρ * V² = 0.5 * 998.2 * (2.5465)² = 3,236.4 Pa',
          'Step 7: Pressure Drop ΔP = f * (L/D) * q = 0.01815 * (100 / 0.1) * 3236.4 = 58,741 Pa = 58.74 kPa',
        ],
      },
      {
        id: 'test_wall_conduction',
        module: 'Wall Conduction',
        name: '1D Steady-State Concrete Wall Conduction',
        description:
          "Verifies Fourier's Law heat transfer rate and heat flux through a single homogeneous concrete wall.",
        inputs: {
          Thickness: '0.2 m',
          Area: '10.0 m²',
          'Thermal Conductivity k': '1.4 W/(m·K)',
          'Hot Temp': '100 °C',
          'Cold Temp': '20 °C',
        },
        expectedOutputs: {
          'Heat Transfer Rate': { value: 5.6, unit: 'kW', tolerancePercent: 0.1 },
          'Heat Flux': { value: 560.0, unit: 'W/m²', tolerancePercent: 0.1 },
        },
        calculatedOutputs: {
          'Heat Transfer Rate': condRes.heatTransferRateKW,
          'Heat Flux': condRes.heatFlux,
        },
        passed:
          Math.abs(condRes.heatTransferRateKW - 5.6) < 0.001 &&
          Math.abs(condRes.heatFlux - 560.0) < 0.1,
        handCalculationSteps: [
          'Step 1: Temperature difference ΔT = Thot - Tcold = 100 - 20 = 80 K',
          'Step 2: Fourier Law Q_dot = k * A * ΔT / L = (1.4 * 10 * 80) / 0.2 = 5600 W = 5.60 kW',
          'Step 3: Heat Flux q" = Q_dot / A = 5600 / 10 = 560 W/m²',
        ],
      },
      {
        id: 'test_newton_cooling',
        module: 'Newton Cooling',
        name: "Transient Object Cooling with Newton's Law",
        description:
          "Verifies analytical time to reach target temperature according to Newton's Law of Cooling analytical logarithmic expression.",
        inputs: {
          'Initial Temp T0': '90 °C',
          'Ambient Temp Tamb': '20 °C',
          'Target Temp Ttarget': '50 °C',
          'Cooling Constant k': '0.05 1/min',
        },
        expectedOutputs: {
          'Time to Target': { value: 16.946, unit: 'min', tolerancePercent: 0.5 },
        },
        calculatedOutputs: {
          'Time to Target': coolingRes.timeToTargetMin,
        },
        passed: Math.abs(coolingRes.timeToTargetMin - 16.946) / 16.946 < 0.005,
        handCalculationSteps: [
          'Step 1: Temp ratio = (Ttarget - Tamb) / (T0 - Tamb) = (50 - 20) / (90 - 20) = 30 / 70 = 0.428571',
          'Step 2: Analytical Solution t = -ln(0.428571) / k = -(-0.847298) / 0.05 = 16.946 minutes',
        ],
      },
    ];
  }
}
