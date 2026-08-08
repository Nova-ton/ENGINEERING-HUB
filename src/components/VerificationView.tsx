import React, { useMemo } from 'react';
import { PageId } from '../types';
import { VerificationEngine } from '../lib/engineering';
import { useTheme } from '../lib/ThemeContext';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileCheck2,
  ShieldCheck,
  Calculator,
} from 'lucide-react';

interface VerificationViewProps {
  onNavigate: (page: PageId) => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const testCases = useMemo(() => VerificationEngine.getTestCases(), []);
  const allPassed = testCases.every((t) => t.passed);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
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
            <FileCheck2 className={`w-5 h-5 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'}`} />
            Hand-Calculation Verification Suite
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase shadow-xs ${
              allPassed
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {allPassed ? 'ALL VERIFICATION TESTS PASSED' : 'SOME TESTS FAILED'}
          </span>
        </div>
      </div>

      {/* Intro Explanation */}
      <div className={`border rounded-2xl p-5 shadow-xs space-y-2 transition-colors ${
        theme === 'dark' ? 'bg-[#111111] border-white/10 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'
      }`}>
        <h2 className={`text-sm font-bold flex items-center gap-2 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          <Calculator className={`w-4 h-4 ${theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'}`} />
          Technical Verification Standard
        </h2>
        <p className="text-xs leading-relaxed opacity-90">
          To ensure technical credibility, every engineering calculation in Engineering Hub is verified against independently hand-calculated textbook baseline problems.
        </p>
      </div>

      {/* Test Cases List */}
      <div className="space-y-6">
        {testCases.map((tc) => (
          <div
            key={tc.id}
            className={`border rounded-2xl p-6 shadow-xs space-y-5 transition-colors ${
              theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
              theme === 'dark' ? 'border-white/10' : 'border-slate-200'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                    theme === 'dark'
                      ? 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {tc.module}
                  </span>
                  <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-900'}`}>{tc.name}</h3>
                </div>
                <p className="text-xs opacity-70 pt-1">{tc.description}</p>
              </div>

              <div className="shrink-0">
                {tc.passed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    VERIFIED MATCH
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-500/30">
                    <XCircle className="w-4 h-4 text-red-500" />
                    DISCREPANCY DETECTED
                  </span>
                )}
              </div>
            </div>

            {/* Inputs & Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Inputs Summary */}
              <div className={`md:col-span-4 border rounded-xl p-4 space-y-2 ${
                theme === 'dark' ? 'bg-[#161618] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                  theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-700'
                }`}>
                  Problem Inputs
                </span>
                <div className="space-y-1.5 text-xs font-mono">
                  {Object.entries(tc.inputs).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-200 dark:border-white/5 pb-1">
                      <span className="opacity-60">{k}:</span>
                      <span className="font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Comparison Table */}
              <div className="md:col-span-8 overflow-x-auto">
                <table className={`w-full text-left text-xs border rounded-xl overflow-hidden ${
                  theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                }`}>
                  <thead className={`font-bold border-b ${
                    theme === 'dark' ? 'bg-[#161618] text-zinc-300 border-white/10' : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    <tr>
                      <th className="py-2.5 px-3">Output Quantity</th>
                      <th className="py-2.5 px-3 text-right">Expected (Hand)</th>
                      <th className="py-2.5 px-3 text-right">Calculated (Software)</th>
                      <th className="py-2.5 px-3 text-right">Tolerance</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono">
                    {Object.entries(tc.expectedOutputs).map(([key, expObj]) => {
                      const exp = expObj as { value: number; unit: string; tolerancePercent: number };
                      const calcVal = tc.calculatedOutputs[key];
                      const diffPct =
                        Math.abs(calcVal - exp.value) / (exp.value === 0 ? 1 : exp.value) * 100;
                      const matches = diffPct <= exp.tolerancePercent;

                      return (
                        <tr key={key} className="hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="py-2.5 px-3 font-sans font-semibold">{key}</td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            {exp.value >= 1000 ? exp.value.toFixed(0) : exp.value.toFixed(4)} {exp.unit}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold ${
                            theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-600'
                          }`}>
                            {calcVal >= 1000 ? calcVal.toFixed(0) : calcVal.toFixed(4)} {exp.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right opacity-60">
                            ±{exp.tolerancePercent}% (Diff: {diffPct.toFixed(2)}%)
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {matches ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Pass</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 font-bold">✕ Fail</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hand Calculation Steps Drawer */}
            <details className={`border rounded-xl p-4 group ${
              theme === 'dark' ? 'bg-[#161618] border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <summary className={`text-xs font-bold cursor-pointer flex items-center justify-between select-none ${
                theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-700'
              }`}>
                <span>View Step-by-Step Hand Calculation Derivation</span>
                <span className="text-xs">▼</span>
              </summary>
              <div className="pt-3 space-y-2 text-xs font-mono border-t border-slate-200 dark:border-white/10 mt-3">
                {tc.handCalculationSteps.map((step, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg border ${
                    theme === 'dark' ? 'bg-[#0e0e10] border-white/5 text-zinc-300' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    {step}
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
};
