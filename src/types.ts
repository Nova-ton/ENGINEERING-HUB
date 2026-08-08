/**
 * Engineering Hub Types & Interfaces
 */

export type PageId = 'home' | 'pipe_flow' | 'heat_transfer' | 'rock_fluid_dashboard' | 'verification';

export interface FluidProperties {
  id: string;
  name: string;
  density: number; // kg/m3
  dynamicViscosity: number; // Pa·s
  description?: string;
}

export type FlowRegime = 'Laminar' | 'Transitional' | 'Turbulent';

export interface PipeFlowInputs {
  fluidId: string;
  customDensity: number;
  customViscosity: number;
  diameter: number; // m
  length: number; // m
  roughness: number; // m
  flowRate: number; // m3/s
}

export interface PipeFlowResults {
  area: number; // m2
  velocity: number; // m/s
  reynoldsNumber: number;
  regime: FlowRegime;
  frictionFactor: number; // Darcy friction factor (Colebrook-White)
  swameeJainFrictionFactor: number;
  haalandFrictionFactor: number;
  pressureDropPa: number; // Pa
  pressureDropKPa: number; // kPa
  pressureDropBar: number; // bar
  pressureDropPsi: number; // psi
  dynamicPressure: number; // Pa
  relativeRoughness: number;
  headLoss: number; // m
  frictionFactorMethod: string;
  warnings: string[];
}

export interface PipeFlowPlotPoint {
  flowRate: number; // m3/s
  flowRateLps: number; // L/s
  velocity: number; // m/s
  reynoldsNumber: number;
  frictionFactor: number;
  pressureDropKPa: number; // kPa
  regime: FlowRegime;
  isOperatingPoint: boolean;
}

export interface MaterialProperties {
  name: string;
  thermalConductivity: number; // W/(m·K)
}

export interface ConductionInputs {
  thickness: number; // m
  area: number; // m2
  thermalConductivity: number; // W/(m·K)
  tHot: number; // °C
  tCold: number; // °C
}

export interface ConductionResults {
  heatTransferRateW: number; // W
  heatTransferRateKW: number; // kW
  heatFlux: number; // W/m2
  tempGradient: number; // K/m
  deltaT: number; // °C or K
  thermalResistance: number; // K/W
}

export interface CoolingInputs {
  tInitial: number; // °C
  tAmbient: number; // °C
  tTarget: number; // °C
  coolingConstant: number; // 1/min
}

export interface CoolingResults {
  timeToTargetMin: number; // min
  timeToTargetSec: number; // sec
  isCooling: boolean; // true if T0 > T_ambient, false if T0 < T_ambient
  isAchievable: boolean;
  explanation: string;
}

export interface CoolingPlotPoint {
  timeMin: number; // min
  temperature: number; // °C
  ambientTemp: number; // °C
  targetTemp: number; // °C
}

export interface DatasetColumnMeta {
  name: string;
  type: 'numeric' | 'string' | 'boolean';
  missingCount: number;
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  median?: number;
}

export interface SummaryStatistics {
  column: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
}

export interface VerificationTestCase {
  id: string;
  module: 'Pipe Flow' | 'Wall Conduction' | 'Newton Cooling';
  name: string;
  description: string;
  inputs: Record<string, number | string>;
  expectedOutputs: Record<string, { value: number; unit: string; tolerancePercent: number }>;
  calculatedOutputs: Record<string, number>;
  passed: boolean;
  handCalculationSteps: string[];
}
