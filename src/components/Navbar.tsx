import React from 'react';
import { PageId } from '../types';
import { Gauge, Flame, Database, CheckCircle2, ArrowLeft, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={`backdrop-blur-md border-b sticky top-0 z-40 transition-colors ${
        theme === 'dark'
          ? 'bg-[#0e0e10]/95 border-white/10 text-zinc-100 shadow-xl'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      {/* Top Banner */}
      <div
        className={`border-b px-4 py-1.5 text-xs text-center flex items-center justify-center gap-2 transition-colors ${
          theme === 'dark'
            ? 'bg-[#181512] border-amber-500/20 text-amber-200/90'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <span
          className={`inline-block w-2 h-2 rounded-full animate-pulse ${
            theme === 'dark' ? 'bg-[#d4af37]' : 'bg-amber-600'
          }`}
        ></span>
        <span>
          <strong>Engineering Safety Disclaimer:</strong> Intended for educational, preliminary analysis, and engineering-support purposes. Results should be independently verified.
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-[#d4af37] to-[#8c701f] border-[#d4af37]/40 text-black'
                  : 'bg-blue-600 border-blue-700 text-white'
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1
                className={`text-xl font-serif italic tracking-tight font-bold flex items-center gap-2 ${
                  theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-900'
                }`}
              >
                ENGINEERING HUB
                <span
                  className={`text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    theme === 'dark'
                      ? 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  v1.0 Pro
                </span>
              </h1>
              <p
                className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                Practical engineering calculations and data analysis suite
              </p>
            </div>
          </div>

          {/* Mobile Back Button */}
          {currentPage !== 'home' && (
            <button
              onClick={() => onNavigate('home')}
              className={`md:hidden inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                theme === 'dark'
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
        </div>

        {/* Navigation & Theme Toggle */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none justify-between md:justify-end">
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                currentPage === 'home'
                  ? theme === 'dark'
                    ? 'bg-[#d4af37] text-black font-bold shadow-md'
                    : 'bg-blue-600 text-white font-bold shadow-md'
                  : theme === 'dark'
                  ? 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => onNavigate('pipe_flow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                currentPage === 'pipe_flow'
                  ? theme === 'dark'
                    ? 'bg-[#d4af37] text-black font-bold shadow-md'
                    : 'bg-blue-600 text-white font-bold shadow-md'
                  : theme === 'dark'
                  ? 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              Pipe Flow
            </button>

            <button
              onClick={() => onNavigate('heat_transfer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                currentPage === 'heat_transfer'
                  ? theme === 'dark'
                    ? 'bg-[#d4af37] text-black font-bold shadow-md'
                    : 'bg-blue-600 text-white font-bold shadow-md'
                  : theme === 'dark'
                  ? 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Heat Transfer
            </button>

            <button
              onClick={() => onNavigate('rock_fluid_dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                currentPage === 'rock_fluid_dashboard'
                  ? theme === 'dark'
                    ? 'bg-[#d4af37] text-black font-bold shadow-md'
                    : 'bg-blue-600 text-white font-bold shadow-md'
                  : theme === 'dark'
                  ? 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Data Dashboard
            </button>

            <button
              onClick={() => onNavigate('verification')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap border ${
                currentPage === 'verification'
                  ? theme === 'dark'
                    ? 'bg-[#d4af37] text-black border-[#d4af37] font-bold shadow-md'
                    : 'bg-blue-600 text-white border-blue-600 font-bold shadow-md'
                  : theme === 'dark'
                  ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40'
                  : 'text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verification
            </button>
          </nav>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium ml-2 ${
              theme === 'dark'
                ? 'bg-zinc-800 text-amber-300 border-white/10 hover:bg-zinc-700'
                : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
            }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span className="hidden sm:inline text-[11px]">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700 fill-slate-700/20" />
                <span className="hidden sm:inline text-[11px]">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

