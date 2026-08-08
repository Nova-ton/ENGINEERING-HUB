import React, { useState, useMemo } from 'react';
import { PageId, ConductionInputs, CoolingInputs } from '../types';
import {
  MATERIAL_THERMAL_CONDUCTIVITY_PRESETS,
  HeatTransferCalculator,
} from '../lib/engineering';
import { useTheme } from '../lib/ThemeContext';
import {
  ArrowLeft,
  Flame,
  HelpCircle,
  Download,
  AlertTriangle,
  Sliders,
  Thermometer,
  Activity,
  Layers,
  CheckCircle2,
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
  ReferenceLine,
  Legend,
} from 'recharts';

interface HeatTransferViewProps {
  onNavigate: (page: PageId) => void;
}

export const HeatTransferView: React.FC<HeatTransferViewProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'conduction' | 'cooling'>('conduction');
  const [showMethodModal, setShowMethodModal] = useState(false);

  // Conduction State
  const [conductionInputs, setConductionInputs] = useState<ConductionInputs>({
    thickness: 0.2, // 0.2 m = 200 mm
    area: 10.0, // 10 m2
    thermalConductivity: 1.4, // Concrete = 1.4 W/mK
    tHot: 100.0, // °C
    tCold: 20.0, // °C
  });

  // Cooling State
  const [coolingInputs, setCoolingInputs] = useState<CoolingInputs>({
    tInitial: 90.0, // °C
    tAmbient: 20.0, // °C
    tTarget: 50.0, // °C
    coolingConstant: 0.05, // 0.05 1/min
  });

  // Presets for conduction
  const applyConductionPreset = (preset: 'concrete' | 'copper' | 'insulation') => {
    if (preset === 'concrete') {
      setConductionInputs({
        thickness: 0.2,
        area: 10.0,
        thermalConductivity: 1.4,
        tHot: 100.0,
        tCold: 20.0,
      });
    } else if (preset === 'copper') {
      setConductionInputs({
        thickness: 0.02,
        area: 1.0,
        thermalConductivity: 401.0,
        tHot: 150.0,
        tCold: 25.0,
      });
    } else if (preset === 'insulation') {
      setConductionInputs({
        thickness: 0.1,
        area: 25.0,
        thermalConductivity: 0.04,
        tHot: 22.0,
        tCold: -10.0,
      });
    }
  };

  // Conduction Results Calculation
  const conductionCalc = useMemo(() => {
    try {
      if (conductionInputs.thickness <= 0) {
        return { results: null, error: 'Wall thickness must be greater than zero meters (L > 0).' };
      }
      if (conductionInputs.area <= 0) {
        return { results: null, error: 'Wall area must be greater than zero m² (A > 0).' };
      }
      if (conductionInputs.thermalConductivity <= 0) {
        return { results: null, error: 'Thermal conductivity must be greater than zero W/(m·K).' };
      }
      const res = HeatTransferCalculator.calculateConduction(conductionInputs);
      return { results: res, error: null };
    } catch (err: unknown) {
      return { results: null, error: err instanceof Error ? err.message : 'Invalid conduction inputs.' };
    }
  }, [conductionInputs]);

  // Cooling Results & Plot Calculation
  const coolingCalc = useMemo(() => {
    try {
      if (coolingInputs.coolingConstant <= 0) {
        return {
          results: null,
          error: 'Cooling constant k must be greater than zero (1/min).',
          plotData: [],
        };
      }
      const res = HeatTransferCalculator.calculateCooling(coolingInputs);
      const calcObj = new HeatTransferCalculator();
      const curve = calcObj.generateCoolingCurve(coolingInputs, 45);

      return { results: res, error: null, plotData: curve };
    } catch (err: unknown) {
      return {
        results: null,
        error: err instanceof Error ? err.message : 'Invalid cooling inputs.',
        plotData: [],
      };
    }
  }, [coolingInputs]);

  // CSV Export for Cooling Curve
  const handleExportCoolingCSV = () => {
    if (!coolingCalc.plotData || coolingCalc.plotData.length === 0) return;
    let csv = 'Time (min),Temperature (°C),Ambient Temp (°C),Target Temp (°C)\n';
    coolingCalc.plotData.forEach((pt) => {
      csv += `${pt.timeMin.toFixed(2)},${pt.temperature.toFixed(2)},${pt.ambientTemp.toFixed(1)},${pt.targetTemp.toFixed(1)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'newtons_cooling_curve.csv');
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
            <Flame className="w-5 h-5 text-orange-500" />
            Heat Transfer Calculator
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
          {activeTab === 'cooling' && coolingCalc.results?.isAchievable && (
            <button
              onClick={handleExportCoolingCSV}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-[#d4af37] hover:bg-[#c5a028] text-black'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Export Cooling Curve
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
          onClick={() => applyConductionPreset('concrete')}
          className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/30 transition"
        >
          🧱 Concrete Wall (200mm)
        </button>
        <button
          onClick={() => applyConductionPreset('copper')}
          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30 transition"
        >
          ⚡ Copper Plate (High Conductance)
        </button>
        <button
          onClick={() => applyConductionPreset('insulation')}
          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30 transition"
        >
          ❄️ Insulation Wall (Cold Ambient)
        </button>
      </div>

      {/* Main Sub-Module Selector Tabs */}
      <div className={`flex border-b gap-4 text-xs font-bold ${
        theme === 'dark' ? 'border-white/10' : 'border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('conduction')}
          className={`pb-2.5 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'conduction'
              ? theme === 'dark'
                ? 'border-[#d4af37] text-[#d4af37]'
                : 'border-blue-600 text-blue-600'
              : 'border-transparent opacity-60 hover:opacity-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1D Wall Conduction (Fourier's Law)</span>
        </button>

        <button
          onClick={() => setActiveTab('cooling')}
          className={`pb-2.5 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'cooling'
              ? 'border-[#d4af37] text-[#d4af37]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Thermometer className="w-4 h-4" />
          <span>Newton's Law of Cooling (Transient)</span>
        </button>
      </div>

      {/* SUB-MODULE 1: FLAT-WALL CONDUCTION */}
      {activeTab === 'conduction' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-4 bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2 font-sans">
                <Sliders className="w-4 h-4 text-orange-400" />
                Conduction Parameters
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">Fourier's Law</span>
            </div>

            {/* Thickness L */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Wall Thickness L (m)</span>
                <span className="text-[11px] font-mono text-orange-400">
                  {(conductionInputs.thickness * 1000).toFixed(0)} mm
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={conductionInputs.thickness}
                onChange={(e) =>
                  setConductionInputs((prev) => ({
                    ...prev,
                    thickness: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs bg-[#161618] border border-white/10 rounded-xl px-3 py-2 font-mono text-zinc-100 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <p className="text-[10px] text-zinc-500 italic">
                Thickness of the solid wall through which heat is conducted.
              </p>
            </div>

            {/* Surface Area A */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">
                Surface Area A (m²)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.01"
                value={conductionInputs.area}
                onChange={(e) =>
                  setConductionInputs((prev) => ({
                    ...prev,
                    area: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs bg-[#161618] border border-white/10 rounded-xl px-3 py-2 font-mono text-zinc-100 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <p className="text-[10px] text-zinc-500 italic">
                Surface area normal to the direction of heat flow.
              </p>
            </div>

            {/* Thermal Conductivity k */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">
                Thermal Conductivity k (W/(m·K))
              </label>
              <select
                onChange={(e) =>
                  setConductionInputs((prev) => ({
                    ...prev,
                    thermalConductivity: parseFloat(e.target.value),
                  }))
                }
                className="w-full text-xs bg-[#161618] border border-white/10 rounded-xl px-3 py-1.5 text-zinc-100 mb-1 focus:border-[#d4af37]"
              >
                <option value="" className="bg-zinc-900 text-zinc-400">-- Material Presets --</option>
                {MATERIAL_THERMAL_CONDUCTIVITY_PRESETS.map((mat) => (
                  <option key={mat.name} value={mat.value} className="bg-zinc-900 text-zinc-100">
                    {mat.name} ({mat.value} W/mK)
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                min="0.001"
                value={conductionInputs.thermalConductivity}
                onChange={(e) =>
                  setConductionInputs((prev) => ({
                    ...prev,
                    thermalConductivity: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs bg-[#161618] border border-white/10 rounded-xl px-3 py-2 font-mono text-zinc-100 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <p className="text-[10px] text-zinc-500 italic">
                Material property describing how readily heat conducts through the wall.
              </p>
            </div>

            <hr className="border-white/5" />

            {/* Temperatures */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Hot-Side T_hot (°C)
                </label>
                <input
                  type="number"
                  step="1"
                  value={conductionInputs.tHot}
                  onChange={(e) =>
                    setConductionInputs((prev) => ({
                      ...prev,
                      tHot: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full text-xs bg-[#161618] border border-white/10 rounded-xl px-3 py-2 font-mono text-zinc-100 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Cold-Side T_cold (°C)
                </label>
                <input
                  type="number"
                  step="1"
                  value={conductionInputs.tCold}
                  onChange={(e) =>
                    setConductionInputs((prev) => ({
                      ...prev,
                      tCold: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full text-xs bg-[#161618] border border-white/10 rounded-xl px-3 py-2 font-mono text-zinc-100 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                />
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-8 space-y-6">
            {conductionCalc.error && (
              <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center gap-3 shadow-xl">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                <span>{conductionCalc.error}</span>
              </div>
            )}

            {conductionCalc.results && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Heat Transfer Rate W */}
                  <div className="bg-gradient-to-br from-[#1c1917] to-[#111111] border border-[#d4af37]/40 text-white rounded-2xl p-5 shadow-2xl space-y-1">
                    <span className="text-[11px] font-semibold text-[#d4af37] uppercase tracking-wider block">
                      Heat Transfer Rate (Q̇)
                    </span>
                    <div className="text-2xl font-black text-[#d4af37] font-mono">
                      {conductionCalc.results.heatTransferRateKW >= 100
                        ? conductionCalc.results.heatTransferRateKW.toFixed(1)
                        : conductionCalc.results.heatTransferRateKW.toFixed(3)}
                      <span className="text-xs text-zinc-300 font-normal ml-1">kW</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block">
                      {conductionCalc.results.heatTransferRateW.toFixed(0)} W
                    </span>
                  </div>

                  {/* Heat Flux */}
                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-xl space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Heat Flux (q'')
                    </span>
                    <div className="text-2xl font-black text-white font-mono">
                      {conductionCalc.results.heatFlux.toFixed(1)}
                      <span className="text-xs text-zinc-400 font-normal ml-1">W/m²</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block">q'' = Q̇ / A</span>
                  </div>

                  {/* Thermal Resistance */}
                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-xl space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Thermal Resistance (R_th)
                    </span>
                    <div className="text-2xl font-black text-white font-mono">
                      {conductionCalc.results.thermalResistance.toFixed(5)}
                      <span className="text-xs text-zinc-400 font-normal ml-1">K/W</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block">R_th = L / (k · A)</span>
                  </div>
                </div>

                {/* Stated Assumptions Card */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
                  <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
                    Stated Engineering Model Assumptions
                  </h3>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2 bg-[#161618] p-2.5 rounded-xl border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0"></span>
                      <span>Steady-State Heat Transfer (∂T/∂t = 0)</span>
                    </li>
                    <li className="flex items-center gap-2 bg-[#161618] p-2.5 rounded-xl border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0"></span>
                      <span>One-Dimensional Heat Conduction</span>
                    </li>
                    <li className="flex items-center gap-2 bg-[#161618] p-2.5 rounded-xl border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0"></span>
                      <span>Single Homogeneous Wall Material</span>
                    </li>
                    <li className="flex items-center gap-2 bg-[#161618] p-2.5 rounded-xl border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0"></span>
                      <span>Constant Thermal Conductivity (k)</span>
                    </li>
                    <li className="flex items-center gap-2 bg-[#161618] p-2.5 rounded-xl border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0"></span>
                      <span>Negligible Thermal Contact Resistance</span>
                    </li>
                    <li className="flex items-center gap-2 bg-[#161618] p-2.5 rounded-xl border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0"></span>
                      <span>Negligible Internal Heat Generation</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-MODULE 2: NEWTON'S LAW OF COOLING */}
      {activeTab === 'cooling' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-4 bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2 font-sans">
                <Sliders className="w-4 h-4 text-orange-400" />
                Cooling / Heating Parameters
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">Newton's Law</span>
            </div>

            {/* Initial Temp T0 */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">
                Initial Temperature T₀ (°C)
              </label>
              <input
                type="number"
                step="1"
                value={coolingInputs.tInitial}
                onChange={(e) =>
                  setCoolingInputs((prev) => ({
                    ...prev,
                    tInitial: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs bg-[#161618] border border-white/10 rounded-xl px-3 py-2 font-mono text-zinc-100 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <p className="text-[10px] text-zinc-500 italic">
                Temperature of the object at the beginning of the process (t = 0).
              </p>
            </div>

            {/* Ambient Temp Tambient */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">
                Ambient Environment Temp T_ambient (°C)
              </label>
              <input
                type="number"
                step="1"
                value={coolingInputs.tAmbient}
                onChange={(e) =>
                  setCoolingInputs((prev) => ({
                    ...prev,
                    tAmbient: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs bg-[#161618] border border-white/10 rounded-xl px-3 py-2 font-mono text-zinc-100 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <p className="text-[10px] text-zinc-500 italic">
                Temperature of the surrounding fluid/air toward which object cools/heats.
              </p>
            </div>

            {/* Target Temp Ttarget */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">
                Target Temperature T_target (°C)
              </label>
              <input
                type="number"
                step="1"
                value={coolingInputs.tTarget}
                onChange={(e) =>
                  setCoolingInputs((prev) => ({
                    ...prev,
                    tTarget: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs bg-[#161618] border border-white/10 rounded-xl px-3 py-2 font-mono text-zinc-100 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <p className="text-[10px] text-zinc-500 italic">
                Temperature at which you want to determine the elapsed cooling/heating time.
              </p>
            </div>

            {/* Cooling Constant k */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300 block">
                Cooling Constant k (1/min)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={coolingInputs.coolingConstant}
                onChange={(e) =>
                  setCoolingInputs((prev) => ({
                    ...prev,
                    coolingConstant: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full text-xs bg-[#161618] border border-white/10 rounded-xl px-3 py-2 font-mono text-zinc-100 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
              />
              <p className="text-[10px] text-zinc-500 italic">
                Empirical heat transfer coefficient constant controlling cooling velocity.
              </p>
            </div>
          </div>

          {/* Output & Chart Column */}
          <div className="lg:col-span-8 space-y-6">
            {coolingCalc.results && (
              <>
                {/* Physical Validity Result Card */}
                {!coolingCalc.results.isAchievable ? (
                  <div className="p-4 bg-amber-950/60 border border-amber-500/30 rounded-2xl text-amber-200 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Target Temperature Unachievable Under Current Conditions</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      {coolingCalc.results.explanation}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Time to Target Min */}
                    <div className="bg-gradient-to-br from-[#1c1917] to-[#111111] border border-[#d4af37]/40 text-white rounded-2xl p-5 shadow-2xl space-y-1">
                      <span className="text-[11px] font-semibold text-[#d4af37] uppercase tracking-wider block">
                        Elapsed Time to Reach Target
                      </span>
                      <div className="text-2xl font-black text-[#d4af37] font-mono">
                        {coolingCalc.results.timeToTargetMin.toFixed(2)}
                        <span className="text-xs text-zinc-300 font-normal ml-1">minutes</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block">
                        {(coolingCalc.results.timeToTargetSec).toFixed(0)} seconds
                      </span>
                    </div>

                    {/* Process Status */}
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-xl space-y-1">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Thermodynamic Process Mode
                      </span>
                      <div className="text-base font-bold text-zinc-100 flex items-center gap-2 pt-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs uppercase font-bold border ${
                            coolingCalc.results.isCooling
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/40'
                              : 'bg-orange-950/80 text-orange-300 border-orange-800/40'
                          }`}
                        >
                          {coolingCalc.results.isCooling ? 'Cooling Process' : 'Ambient Heating'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block pt-1">
                        {coolingCalc.results.explanation}
                      </span>
                    </div>
                  </div>
                )}

                {/* Temperature vs Time Chart */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-400" />
                        Transient Temperature vs. Time Curve T(t)
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Newton's Law analytical solution curve approaching ambient asymptote T_ambient.
                      </p>
                    </div>

                    <div className="text-xs font-mono text-[#d4af37] bg-[#d4af37]/10 px-2.5 py-1 rounded-lg border border-[#d4af37]/30 shrink-0">
                      T(t) = T_ambient + (T₀ - T_ambient) · e^(-kt)
                    </div>
                  </div>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={coolingCalc.plotData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis
                          dataKey="timeMin"
                          unit=" min"
                          tick={{ fontSize: 11, fill: '#a1a1aa' }}
                          stroke="#3f3f46"
                          label={{
                            value: 'Time t (minutes)',
                            position: 'insideBottom',
                            offset: -15,
                            fontSize: 11,
                            fill: '#a1a1aa',
                          }}
                        />
                        <YAxis
                          unit=" °C"
                          tick={{ fontSize: 11, fill: '#a1a1aa' }}
                          stroke="#3f3f46"
                          label={{
                            value: 'Temperature T (°C)',
                            angle: -90,
                            position: 'insideLeft',
                            offset: 0,
                            fontSize: 11,
                            fill: '#a1a1aa',
                          }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#161618', borderColor: '#d4af37', borderRadius: '8px', color: '#f2f2f2' }}
                          formatter={(val: number) => [`${val.toFixed(2)} °C`, 'Temperature T']}
                          labelFormatter={(val: number) => `Time: ${val.toFixed(2)} min`}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#f2f2f2' }} />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          name="Object Temperature T(t) (°C)"
                          stroke="#f97316"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 6, fill: '#d4af37' }}
                        />
                        {/* Ambient Temperature Reference Line */}
                        <ReferenceLine
                          y={coolingInputs.tAmbient}
                          stroke="#a1a1aa"
                          strokeDasharray="4 4"
                          label={{ value: 'Ambient T_ambient', fill: '#a1a1aa', fontSize: 10, position: 'right' }}
                        />
                        {/* Target Temperature Reference Line */}
                        <ReferenceLine
                          y={coolingInputs.tTarget}
                          stroke="#38bdf8"
                          strokeDasharray="3 3"
                          label={{ value: 'Target T_target', fill: '#38bdf8', fontSize: 10, position: 'right' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Methods & Equations Modal */}
      {showMethodModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 text-zinc-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-serif italic font-bold text-[#d4af37] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#d4af37]" />
                Heat Transfer Method & Equations
              </h3>
              <button
                onClick={() => setShowMethodModal(false)}
                className="text-xs font-bold text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
              <div className="bg-[#161618] p-3.5 rounded-xl border border-white/10 space-y-1">
                <h4 className="font-bold text-[#d4af37]">1. Fourier's Law of Heat Conduction</h4>
                <p>
                  One-dimensional steady-state conduction through a single flat wall is calculated as:
                </p>
                <div className="bg-[#0a0a0a] p-2.5 rounded-lg border border-white/10 font-mono text-center text-[#d4af37] text-sm font-bold my-1">
                  Q̇ = k · A · (T_hot - T_cold) / L
                </div>
                <p>
                  where <strong>k</strong> is thermal conductivity, <strong>A</strong> is wall surface area, and <strong>L</strong> is wall thickness.
                </p>
              </div>

              <div className="bg-[#161618] p-3.5 rounded-xl border border-white/10 space-y-1">
                <h4 className="font-bold text-[#d4af37]">2. Newton's Law of Cooling (Analytical Solution)</h4>
                <p>
                  The rate of heat loss of a body is directly proportional to the difference in temperatures between the body and its environment:
                </p>
                <div className="bg-[#0a0a0a] p-2.5 rounded-lg border border-white/10 font-mono text-center text-cyan-400 text-xs font-bold my-1">
                  T(t) = T_ambient + (T₀ - T_ambient) · e^(-kt)
                </div>
                <p>Solving analytically for elapsed time to reach target temperature T_target:</p>
                <div className="bg-[#0a0a0a] p-2.5 rounded-lg border border-white/10 font-mono text-center text-cyan-400 text-xs font-bold my-1">
                  t = - (1 / k) · ln[ (T_target - T_ambient) / (T₀ - T_ambient) ]
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
