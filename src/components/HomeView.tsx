import React from 'react';
import { PageId } from '../types';
import { useTheme } from '../lib/ThemeContext';
import {
  Gauge,
  Flame,
  Database,
  ArrowRight,
  CheckCircle,
  Layers,
  Thermometer,
  Compass,
  Cpu,
  BarChart2,
  FileCheck2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (page: PageId) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { theme } = useTheme();

  return (
    <div className="space-y-10 pb-12 bg-[#252424]">
      {/* Hero Welcome Banner */}
      <section
        className={`rounded-2xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden transition-colors ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-[#111111] via-[#161618] to-[#0d0d0e] border border-white/10'
            : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 border border-blue-500/20'
        }`}
      >
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl space-y-4 relative z-10">
          <div
            className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold px-3 py-1 rounded-full border ${
              theme === 'dark'
                ? 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30'
                : 'bg-white/10 text-white border-white/20'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Easy-to-Use Engineering Calculation Suite
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif italic tracking-tight text-white font-bold">
            ENGINEERING{' '}
            <span
              className={`not-italic font-sans font-extrabold ${
                theme === 'dark' ? 'text-[#d4af37]' : 'text-amber-300'
              }`}
            >
              HUB
            </span>
          </h1>
          <p className="text-white/90 text-sm sm:text-base leading-relaxed font-normal">
            Simple, practical tools for fluid dynamics, heat transfer, and engineering data analysis. Get instant calculations, clear visual plots, and verified textbook accuracy.
          </p>
        </div>
      </section>

      {/* New User Quick-Start Guide */}
      <section
        className={`rounded-2xl p-6 border transition-colors ${
          theme === 'dark'
            ? 'bg-[#141416] border-amber-500/30 text-zinc-200'
            : 'bg-blue-50/80 border-blue-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-sm mb-3">
          <Sparkles
            className={`w-4 h-4 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'}`}
          />
          <h3 className="font-sans text-base">New User Quick Start Guide</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div
            onClick={() => onNavigate('pipe_flow')}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:scale-[1.01] ${
              theme === 'dark'
                ? 'bg-zinc-900 border-white/10 hover:border-[#d4af37]/50'
                : 'bg-white border-slate-200 shadow-xs hover:border-blue-400'
            }`}
          >
            <div className="font-bold flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-cyan-500">
                <Gauge className="w-4 h-4" /> 1. Calculate Pipe Flow
              </span>
              <span className="text-[10px] text-slate-400">Step 1</span>
            </div>
            <p className="opacity-80 leading-relaxed">
              Select a fluid like Water or Oil, enter pipe dimensions, and instantly view flow velocity, friction factors, and pressure drop plots.
            </p>
          </div>

          <div
            onClick={() => onNavigate('heat_transfer')}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:scale-[1.01] ${
              theme === 'dark'
                ? 'bg-zinc-900 border-white/10 hover:border-[#d4af37]/50'
                : 'bg-white border-slate-200 shadow-xs hover:border-amber-400'
            }`}
          >
            <div className="font-bold flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-amber-500">
                <Flame className="w-4 h-4" /> 2. Calculate Heat Loss
              </span>
              <span className="text-[10px] text-slate-400">Step 2</span>
            </div>
            <p className="opacity-80 leading-relaxed">
              Calculate conduction heat loss through solid walls, or compute cooling times for objects approaching room temperature.
            </p>
          </div>

          <div
            onClick={() => onNavigate('rock_fluid_dashboard')}
            className={`p-3.5 rounded-xl border cursor-pointer transition hover:scale-[1.01] ${
              theme === 'dark'
                ? 'bg-zinc-900 border-white/10 hover:border-[#d4af37]/50'
                : 'bg-white border-slate-200 shadow-xs hover:border-emerald-400'
            }`}
          >
            <div className="font-bold flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <Database className="w-4 h-4" /> 3. Analyze Data
              </span>
              <span className="text-[10px] text-slate-400">Step 3</span>
            </div>
            <p className="opacity-80 leading-relaxed">
              Drag-and-drop any engineering CSV dataset or choose sample datasets to inspect summary statistics and scatter plots.
            </p>
          </div>
        </div>
      </section>

      {/* Primary Modules Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className={`text-xl font-serif italic font-bold flex items-center gap-2 ${
              theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'
            }`}
          >
            <Layers
              className={`w-5 h-5 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'}`}
            />
            Primary Modules
          </h2>
          <span className="text-xs opacity-60 font-medium">3 Modules Ready</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Pipe Flow */}
          <div
            className={`rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden group ${
              theme === 'dark'
                ? 'bg-[#111111] border-white/10 shadow-xl hover:border-[#d4af37]/40'
                : 'bg-white border-slate-200 shadow-sm hover:border-blue-400'
            }`}
          >
            <div
              className={`p-5 border-b flex items-center gap-3 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-[#18181c] to-[#111111] border-white/10'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 flex items-center justify-center shadow-xs">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`font-bold text-base font-sans ${
                    theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'
                  }`}
                >
                  PIPE FLOW ANALYSER
                </h3>
                <span className="text-[10px] font-semibold text-cyan-500 uppercase tracking-wider">
                  Hydraulics & Pressure Drop
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
              <p
                className={`text-xs leading-relaxed ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                Analyse fluid flow through circular pipes. Pre-loaded with Water, Oil, Air, and Gasoline properties for effortless analysis.
              </p>

              <div
                className={`space-y-2 pt-3 border-t text-[11px] ${
                  theme === 'dark'
                    ? 'border-white/5 text-zinc-400'
                    : 'border-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'
                    }`}
                  />
                  <span>Flow regime (Laminar, Turbulent)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'
                    }`}
                  />
                  <span>Interactive Pressure Drop vs Flow plot</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'
                    }`}
                  />
                  <span>CSV Curve Export & SI units</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('pipe_flow')}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md ${
                  theme === 'dark'
                    ? 'bg-[#d4af37] hover:bg-[#c5a028] text-black'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <span>Open Pipe Flow</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Heat Transfer */}
          <div
            className={`rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden group ${
              theme === 'dark'
                ? 'bg-[#111111] border-white/10 shadow-xl hover:border-[#d4af37]/40'
                : 'bg-white border-slate-200 shadow-sm hover:border-amber-400'
            }`}
          >
            <div
              className={`p-5 border-b flex items-center gap-3 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-[#18181c] to-[#111111] border-white/10'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-xs">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`font-bold text-base font-sans ${
                    theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'
                  }`}
                >
                  HEAT TRANSFER CALCULATOR
                </h3>
                <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                  Conduction & Cooling Time
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
              <p
                className={`text-xs leading-relaxed ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                Perform wall heat conduction loss calculations or Newton's Law of Cooling time-to-target calculations with visual curves.
              </p>

              <div
                className={`space-y-2 pt-3 border-t text-[11px] ${
                  theme === 'dark'
                    ? 'border-white/5 text-zinc-400'
                    : 'border-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'
                    }`}
                  />
                  <span>Fourier's Law Steady Wall Conduction</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'
                    }`}
                  />
                  <span>Newton's Cooling analytical curve</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'
                    }`}
                  />
                  <span>Material presets (Steel, Concrete, Brick, etc.)</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('heat_transfer')}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md ${
                  theme === 'dark'
                    ? 'bg-[#d4af37] hover:bg-[#c5a028] text-black'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <span>Open Heat Transfer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: Data Dashboard */}
          <div
            className={`rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden group ${
              theme === 'dark'
                ? 'bg-[#111111] border-white/10 shadow-xl hover:border-[#d4af37]/40'
                : 'bg-white border-slate-200 shadow-sm hover:border-emerald-400'
            }`}
          >
            <div
              className={`p-5 border-b flex items-center gap-3 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-[#18181c] to-[#111111] border-white/10'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3
                  className={`font-bold text-base font-sans ${
                    theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'
                  }`}
                >
                  DATA DASHBOARD
                </h3>
                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                  CSV Analysis & Visual Charts
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
              <p
                className={`text-xs leading-relaxed ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
                }`}
              >
                Upload any engineering dataset or test pre-loaded sample datasets. Auto-calculates summary stats, filters ranges, and plots charts.
              </p>

              <div
                className={`space-y-2 pt-3 border-t text-[11px] ${
                  theme === 'dark'
                    ? 'border-white/5 text-zinc-400'
                    : 'border-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'
                    }`}
                  />
                  <span>Drag-and-drop CSV upload & preloaded datasets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'
                    }`}
                  />
                  <span>Interactive column range filtering</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'
                    }`}
                  />
                  <span>Porosity Histograms & Crossplots</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('rock_fluid_dashboard')}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md ${
                  theme === 'dark'
                    ? 'bg-[#d4af37] hover:bg-[#c5a028] text-black'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <span>Open Data Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Banner */}
      <section
        className={`rounded-2xl p-6 sm:p-8 border shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors ${
          theme === 'dark'
            ? 'bg-[#111111] text-zinc-100 border-[#d4af37]/30'
            : 'bg-white text-slate-800 border-slate-200'
        }`}
      >
        <div className="space-y-2 max-w-2xl">
          <div
            className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded border ${
              theme === 'dark'
                ? 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Accuracy Verified
          </div>
          <h3
            className={`text-xl font-serif italic font-bold ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            Independent Textbook Verification
          </h3>
          <p
            className={`text-xs leading-relaxed ${
              theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
            }`}
          >
            All calculations are tested against textbook hand calculations (e.g. Water Flow in Steel Pipe, Concrete Wall Conduction, Newton's Cooling) with step-by-step derivations.
          </p>
        </div>

        <button
          onClick={() => onNavigate('verification')}
          className={`shrink-0 px-6 py-3 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 ${
            theme === 'dark'
              ? 'bg-[#d4af37] hover:bg-[#c5a028] text-black'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>View Hand Calculations</span>
        </button>
      </section>
    </div>
  );
};

