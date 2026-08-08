import React, { useState, useMemo } from 'react';
import { PageId, PipeFlowInputs } from '../types';
import {
  PRESET_FLUIDS,
  PIPE_ROUGHNESS_PRESETS,
  Fluid,
  Pipe,
} from '../lib/engineering';
import { useTheme } from '../lib/ThemeContext';
import {
  ArrowLeft,
  Gauge,
  Info,
  Download,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  Sliders,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  Legend,
} from 'recharts';

interface PipeFlowViewProps {
  onNavigate: (page: PageId) => void;
}

export const PipeFlowView: React.FC<PipeFlowViewProps> = ({ onNavigate }) => {
  const { theme } = useTheme();

  // Input State
  const [inputs, setInputs] = useState<PipeFlowInputs>({
    fluidId: 'water',
    customDensity: 998.2,
    customViscosity: 0.001002,
    diameter: 0.1, // 100 mm = 0.1 m
    length: 100.0, // 100 m
    roughness: 0.000045, // Commercial steel 0.045 mm
    flowRate: 0.02, // 0.02 m3/s = 20 L/s = 72 m3/h
  });

  const [flowRateUnit, setFlowRateUnit] = useState<'m3s' | 'm3h' | 'lps'>('m3s');
  const [showMethodModal, setShowMethodModal] = useState(false);

  // Quick Presets
  const applyPreset = (presetType: 'water' | 'oil' | 'air') => {
    if (presetType === 'water') {
      setInputs({
        fluidId: 'water',
        customDensity: 998.2,
        customViscosity: 0.001002,
        diameter: 0.1,
        length: 100.0,
        roughness: 0.000045,
        flowRate: 0.02,
      });
      setFlowRateUnit('m3s');
    } else if (presetType === 'oil') {
      setInputs({
        fluidId: 'crude_oil',
        customDensity: 850.0,
        customViscosity: 0.01,
        diameter: 0.2,
        length: 500.0,
        roughness: 0.000045,
        flowRate: 0.05,
      });
      setFlowRateUnit('m3s');
    } else if (presetType === 'air') {
      setInputs({
        fluidId: 'air',
        customDensity: 1.204,
        customViscosity: 0.0000181,
        diameter: 0.3,
        length: 50.0,
        roughness: 0.0000015,
        flowRate: 0.5,
      });
      setFlowRateUnit('m3s');
    }
  };

  // Selected Fluid Instance
  const selectedFluid = useMemo(() => {
    if (inputs.fluidId === 'custom') {
      return new Fluid('User-defined Fluid', inputs.customDensity, inputs.customViscosity);
    }
    const preset = PRESET_FLUIDS.find((f) => f.id === inputs.fluidId) || PRESET_FLUIDS[0];
    return new Fluid(preset.name, preset.density, preset.dynamicViscosity);
  }, [inputs.fluidId, inputs.customDensity, inputs.customViscosity]);

  // Derived Flow Rate in m3/s
  const flowRateM3s = useMemo(() => {
    if (flowRateUnit === 'm3h') return inputs.flowRate / 3600;
    if (flowRateUnit === 'lps') return inputs.flowRate / 1000;
    return inputs.flowRate;
  }, [inputs.flowRate, flowRateUnit]);

  // Validation & Engineering Calculations
  const { results, error, plotData } = useMemo(() => {
    try {
      if (inputs.diameter <= 0) {
        return { results: null, error: 'Pipe internal diameter must be greater than zero meters (D > 0).', plotData: [] };
      }
      if (inputs.length < 0) {
        return { results: null, error: 'Pipe length cannot be negative (L ≥ 0).', plotData: [] };
      }
      if (inputs.roughness < 0) {
        return { results: null, error: 'Pipe roughness cannot be negative (ε ≥ 0).', plotData: [] };
      }
      if (inputs.roughness >= inputs.diameter) {
        return { results: null, error: 'Pipe roughness (ε) must be smaller than internal diameter (D).', plotData: [] };
      }
      if (flowRateM3s < 0) {
        return { results: null, error: 'Volumetric flow rate cannot be negative (Q ≥ 0).', plotData: [] };
      }

      const pipe = new Pipe(inputs.diameter, inputs.length, inputs.roughness);
      const res = pipe.analyzeFlow(selectedFluid, flowRateM3s);
      const curve = pipe.generatePressureDropCurve(selectedFluid, flowRateM3s, 35);

      return { results: res, error: null, plotData: curve };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid pipe engineering parameters.';
      return { results: null, error: msg, plotData: [] };
    }
  }, [inputs.diameter, inputs.length, inputs.roughness, selectedFluid, flowRateM3s]);

  // Handle Preset Fluid Switch
  const handleFluidSelect = (fluidId: string) => {
    if (fluidId !== 'custom') {
      const preset = PRESET_FLUIDS.find((f) => f.id === fluidId);
      if (preset) {
        setInputs((prev) => ({
          ...prev,
          fluidId,
          customDensity: preset.density,
          customViscosity: preset.dynamicViscosity,
        }));
      }
    } else {
      setInputs((prev) => ({ ...prev, fluidId: 'custom' }));
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!results || plotData.length === 0) return;

    let csv = 'Flow Rate (m3/s),Flow Rate (L/s),Velocity (m/s),Reynolds Number,Flow Regime,Friction Factor (Colebrook),Pressure Drop (kPa)\n';
    plotData.forEach((pt) => {
      csv += `${pt.flowRate.toFixed(6)},${pt.flowRateLps.toFixed(2)},${pt.velocity.toFixed(3)},${pt.reynoldsNumber.toFixed(0)},${pt.regime},${pt.frictionFactor.toFixed(6)},${pt.pressureDropKPa.toFixed(3)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pipe_flow_results_D${inputs.diameter}m_L${inputs.length}m.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 transition-colors ${
        theme === 'dark' ? 'border-white/10' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              theme === 'dark'
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-white/10'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
            }`}
          >
            <ArrowLeft className={`w-4 h-4 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'}`} />
            ← Dashboard
          </button>
          <div className="h-4 w-px bg-slate-300 dark:bg-white/10 hidden sm:block"></div>
          <h1 className={`text-xl font-serif italic font-bold flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            <Gauge className="w-5 h-5 text-cyan-500" />
            Pipe Flow Analyser
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMethodModal(!showMethodModal)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${
              theme === 'dark'
                ? 'bg-[#161618] text-[#d4af37] border-[#d4af37]/30 hover:bg-white/5'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Methods & Equations
          </button>
          {results && (
            <button
              onClick={handleExportCSV}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-[#d4af37] hover:bg-[#c5a028] text-black'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Preset Quick Buttons for New Users */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap items-center gap-3 text-xs ${
        theme === 'dark' ? 'bg-[#141416] border-white/10' : 'bg-slate-100 border-slate-200'
      }`}>
        <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Example Presets:
        </span>
        <button
          onClick={() => applyPreset('water')}
          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold border border-cyan-500/30 transition"
        >
          🚰 Water Pipe (DN100, Steel)
        </button>
        <button
          onClick={() => applyPreset('oil')}
          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30 transition"
        >
          🛢️ Oil Pipeline (DN200, 500m)
        </button>
        <button
          onClick={() => applyPreset('air')}
          className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/30 transition"
        >
          💨 Air Duct (300mm, Smooth)
        </button>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Panel */}
        <div className={`lg:col-span-4 border rounded-2xl p-5 shadow-sm space-y-5 transition-colors ${
          theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            theme === 'dark' ? 'border-white/10' : 'border-slate-200'
          }`}>
            <h2 className={`text-sm font-bold flex items-center gap-2 font-sans ${
              theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'
            }`}>
              <Sliders className="w-4 h-4 text-cyan-500" />
              Hydraulic Inputs
            </h2>
            <span className="text-[11px] font-mono opacity-60">SI Units</span>
          </div>

          {/* Fluid Selection */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold flex items-center justify-between ${
              theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'
            }`}>
              <span>Working Fluid</span>
            </label>
            <select
              value={inputs.fluidId}
              onChange={(e) => handleFluidSelect(e.target.value)}
              className={`w-full text-xs rounded-xl px-3 py-2 border font-medium ${
                theme === 'dark'
                  ? 'bg-[#161618] border-white/10 text-zinc-100'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              {PRESET_FLUIDS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[11px] font-medium opacity-70 block mb-1">
                  Density ρ (kg/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  disabled={inputs.fluidId !== 'custom'}
                  value={selectedFluid.density}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      customDensity: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={`w-full text-xs rounded-xl px-2.5 py-1.5 border font-mono ${
                    inputs.fluidId !== 'custom'
                      ? 'bg-slate-100 dark:bg-zinc-900/60 opacity-75'
                      : 'bg-white dark:bg-[#161618]'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium opacity-70 block mb-1">
                  Viscosity μ (Pa·s)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  disabled={inputs.fluidId !== 'custom'}
                  value={selectedFluid.dynamicViscosity}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      customViscosity: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={`w-full text-xs rounded-xl px-2.5 py-1.5 border font-mono ${
                    inputs.fluidId !== 'custom'
                      ? 'bg-slate-100 dark:bg-zinc-900/60 opacity-75'
                      : 'bg-white dark:bg-[#161618]'
                  }`}
                />
              </div>
            </div>
          </div>

          <hr className={theme === 'dark' ? 'border-white/5' : 'border-slate-200'} />

          {/* Pipe Geometry Inputs */}
          <div className="space-y-4">
            {/* Diameter D */}
            <div className="space-y-1">
              <label className={`text-xs font-semibold flex items-center justify-between ${
                theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'
              }`}>
                <span>Internal Diameter D (m)</span>
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                  {(inputs.diameter * 1000).toFixed(0)} mm
                </span>
              </label>
              <input
                type="number"
                step="0.005"
                min="0.001"
                value={inputs.diameter}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, diameter: parseFloat(e.target.value) || 0 }))
                }
                className={`w-full text-xs border rounded-xl px-3 py-2 font-mono ${
                  theme === 'dark'
                    ? 'bg-[#161618] border-white/10 text-zinc-100'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>

            {/* Length L */}
            <div className="space-y-1">
              <label className={`text-xs font-semibold block ${
                theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'
              }`}>
                Pipe Length L (m)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={inputs.length}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, length: parseFloat(e.target.value) || 0 }))
                }
                className={`w-full text-xs border rounded-xl px-3 py-2 font-mono ${
                  theme === 'dark'
                    ? 'bg-[#161618] border-white/10 text-zinc-100'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>

            {/* Roughness ε */}
            <div className="space-y-1">
              <label className={`text-xs font-semibold flex items-center justify-between ${
                theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'
              }`}>
                <span>Pipe Material & Roughness ε</span>
                <span className="text-[11px] font-mono opacity-70">
                  {(inputs.roughness * 1000).toFixed(4)} mm
                </span>
              </label>

              <select
                value={inputs.roughness}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, roughness: parseFloat(e.target.value) || 0 }))
                }
                className={`w-full text-xs border rounded-xl px-3 py-1.5 ${
                  theme === 'dark'
                    ? 'bg-[#161618] border-white/10 text-zinc-100'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                {PIPE_ROUGHNESS_PRESETS.map((preset) => (
                  <option key={preset.name} value={preset.value}>
                    {preset.name} ({preset.label})
                  </option>
                ))}
              </select>
            </div>

            {/* Flow Rate Q */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'
                }`}>
                  Flow Rate Q
                </label>
                <div className={`inline-flex rounded-lg p-0.5 border ${
                  theme === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-slate-200 border-slate-300'
                }`}>
                  {(['m3s', 'lps', 'm3h'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setFlowRateUnit(unit)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                        flowRateUnit === unit
                          ? theme === 'dark'
                            ? 'bg-[#d4af37] text-black shadow-xs'
                            : 'bg-blue-600 text-white shadow-xs'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {unit === 'm3s' ? 'm³/s' : unit === 'lps' ? 'L/s' : 'm³/h'}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="number"
                step={flowRateUnit === 'm3s' ? '0.001' : '0.1'}
                min="0"
                value={inputs.flowRate}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, flowRate: parseFloat(e.target.value) || 0 }))
                }
                className={`w-full text-xs border rounded-xl px-3 py-2 font-mono ${
                  theme === 'dark'
                    ? 'bg-[#161618] border-white/10 text-zinc-100'
                    : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Output Metrics & Plots */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
              <div>
                <strong className="font-bold block">Input Validation Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {results && (
            <>
              {/* Primary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Velocity */}
                <div className={`border rounded-2xl p-4 shadow-xs space-y-1 ${
                  theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-[11px] font-semibold opacity-60 uppercase tracking-wider block">
                    Velocity
                  </span>
                  <div className="text-xl font-black font-mono">
                    {results.velocity.toFixed(3)}
                    <span className="text-xs opacity-60 font-normal ml-1">m/s</span>
                  </div>
                  <span className="text-[10px] opacity-60 block">V = Q / A</span>
                </div>

                {/* Reynolds Number */}
                <div className={`border rounded-2xl p-4 shadow-xs space-y-1 ${
                  theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-[11px] font-semibold opacity-60 uppercase tracking-wider block">
                    Reynolds (Re)
                  </span>
                  <div className="text-xl font-black font-mono">
                    {results.reynoldsNumber >= 10000
                      ? results.reynoldsNumber.toExponential(2)
                      : results.reynoldsNumber.toFixed(0)}
                  </div>
                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    {results.regime}
                  </span>
                </div>

                {/* Friction Factor */}
                <div className={`border rounded-2xl p-4 shadow-xs space-y-1 ${
                  theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-[11px] font-semibold opacity-60 uppercase tracking-wider block">
                    Friction (f)
                  </span>
                  <div className="text-xl font-black font-mono">
                    {results.frictionFactor.toFixed(5)}
                  </div>
                  <span className="text-[10px] opacity-60 block truncate">Colebrook</span>
                </div>

                {/* Pressure Drop */}
                <div className={`border rounded-2xl p-4 shadow-md space-y-1 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-[#1c1917] to-[#111111] border-[#d4af37]/40 text-[#d4af37]'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  <span className="text-[11px] font-semibold uppercase tracking-wider block opacity-80">
                    Pressure Drop (ΔP)
                  </span>
                  <div className="text-xl font-black font-mono">
                    {results.pressureDropKPa >= 100
                      ? results.pressureDropKPa.toFixed(1)
                      : results.pressureDropKPa.toFixed(3)}
                    <span className="text-xs font-normal ml-1">kPa</span>
                  </div>
                  <span className="text-[10px] opacity-75 block">
                    {(results.pressureDropPa).toFixed(0)} Pa ({results.pressureDropBar.toFixed(3)} bar)
                  </span>
                </div>
              </div>

              {/* Interactive Pressure Drop Plot */}
              <div className={`border rounded-2xl p-5 shadow-sm space-y-4 ${
                theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
                  theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                }`}>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-500" />
                      Pressure Drop vs. Volumetric Flow Rate Curve
                    </h3>
                    <p className="text-xs opacity-60">
                      Calculates pressure drop across different flow rates. Dot marks your operating point.
                    </p>
                  </div>

                  <div className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                    theme === 'dark'
                      ? 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    Operating Q: {(flowRateM3s * 1000).toFixed(1)} L/s ({(results.pressureDropKPa).toFixed(2)} kPa)
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={plotData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'} />
                      <XAxis
                        dataKey="flowRateLps"
                        unit=" L/s"
                        tick={{ fontSize: 11, fill: theme === 'dark' ? '#a1a1aa' : '#64748b' }}
                        stroke={theme === 'dark' ? '#3f3f46' : '#cbd5e1'}
                        label={{
                          value: 'Volumetric Flow Rate Q (L/s)',
                          position: 'insideBottom',
                          offset: -15,
                          fontSize: 11,
                          fill: theme === 'dark' ? '#a1a1aa' : '#64748b',
                        }}
                      />
                      <YAxis
                        unit=" kPa"
                        tick={{ fontSize: 11, fill: theme === 'dark' ? '#a1a1aa' : '#64748b' }}
                        stroke={theme === 'dark' ? '#3f3f46' : '#cbd5e1'}
                        label={{
                          value: 'Pressure Drop ΔP (kPa)',
                          angle: -90,
                          position: 'insideLeft',
                          offset: 0,
                          fontSize: 11,
                          fill: theme === 'dark' ? '#a1a1aa' : '#64748b',
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#161618' : '#ffffff',
                          borderColor: theme === 'dark' ? '#d4af37' : '#2563eb',
                          borderRadius: '8px',
                          color: theme === 'dark' ? '#f2f2f2' : '#0f172a',
                        }}
                        formatter={(val: number) => [`${val.toFixed(3)} kPa`, 'Pressure Drop ΔP']}
                        labelFormatter={(val: number) => `Flow Rate Q: ${val.toFixed(2)} L/s`}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Line
                        type="monotone"
                        dataKey="pressureDropKPa"
                        name="Frictional Pressure Drop ΔP (kPa)"
                        stroke="#0284c7"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, fill: theme === 'dark' ? '#d4af37' : '#2563eb' }}
                      />
                      {plotData.find((p) => p.isOperatingPoint) && (
                        <ReferenceDot
                          x={plotData.find((p) => p.isOperatingPoint)?.flowRateLps}
                          y={plotData.find((p) => p.isOperatingPoint)?.pressureDropKPa}
                          r={7}
                          fill={theme === 'dark' ? '#d4af37' : '#2563eb'}
                          stroke="#ffffff"
                          strokeWidth={2}
                          isFront={true}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Breakdown */}
              <div className={`border rounded-2xl p-4 space-y-3 ${
                theme === 'dark' ? 'bg-[#161618] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <h3 className="text-xs font-bold flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-500" />
                  Detailed Calculation Summary
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] opacity-60 block">Cross-sectional Area A</span>
                    <span className="font-mono font-semibold">{results.area.toFixed(6)} m²</span>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-60 block">Dynamic Pressure q</span>
                    <span className="font-mono font-semibold">{results.dynamicPressure.toFixed(2)} Pa</span>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-60 block">Relative Roughness ε/D</span>
                    <span className="font-mono font-semibold">{results.relativeRoughness.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-60 block">Head Loss h_L</span>
                    <span className="font-mono font-semibold">{results.headLoss.toFixed(2)} m</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Methods Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 ${
            theme === 'dark' ? 'bg-[#111111] border-white/10 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-serif italic font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Pipe Flow Methods & Equations
              </h3>
              <button
                onClick={() => setShowMethodModal(false)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-slate-100 dark:bg-white/5"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
              <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-[#161618]">
                <h4 className="font-bold text-blue-600 dark:text-[#d4af37]">1. Darcy-Weisbach Equation</h4>
                <p className="my-1">
                  Frictional pressure drop along a pipe is calculated as:
                </p>
                <div className="p-2 rounded-lg font-mono text-center font-bold my-1 bg-white dark:bg-black border">
                  ΔP = f · (L / D) · (ρ · V² / 2)
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-[#161618]">
                <h4 className="font-bold text-blue-600 dark:text-[#d4af37]">2. Colebrook-White Solver</h4>
                <p className="my-1">
                  Solves the implicit Colebrook friction equation using Newton-Raphson iteration for turbulent flow (Re ≥ 4000).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

