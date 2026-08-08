import React, { useState } from 'react';
import { PageId } from './types';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { PipeFlowView } from './components/PipeFlowView';
import { HeatTransferView } from './components/HeatTransferView';
import { DataDashboardView } from './components/DataDashboardView';
import { VerificationView } from './components/VerificationView';
import { ThemeProvider, useTheme } from './lib/ThemeContext';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-[#0a0a0a] text-[#f2f2f2] selection:bg-[#d4af37]/30 selection:text-white'
          : 'bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900'
      }`}
    >
      {/* Global Navbar */}
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentPage === 'home' && <HomeView onNavigate={setCurrentPage} />}
        {currentPage === 'pipe_flow' && <PipeFlowView onNavigate={setCurrentPage} />}
        {currentPage === 'heat_transfer' && <HeatTransferView onNavigate={setCurrentPage} />}
        {currentPage === 'rock_fluid_dashboard' && <DataDashboardView onNavigate={setCurrentPage} />}
        {currentPage === 'verification' && <VerificationView onNavigate={setCurrentPage} />}
      </main>

      {/* Global Footer */}
      <footer
        className={`border-t py-8 mt-12 text-xs transition-colors ${
          theme === 'dark'
            ? 'bg-[#0e0e10] text-zinc-400 border-white/10'
            : 'bg-white text-slate-600 border-slate-200 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div
                className={`font-serif italic text-base font-bold tracking-tight ${
                  theme === 'dark' ? 'text-[#d4af37]' : 'text-blue-700'
                }`}
              >
                ENGINEERING HUB
              </div>
              <p
                className={`text-[11px] mt-0.5 ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'
                }`}
              >
                Simple, accessible engineering calculations & data analytics suite.
              </p>
            </div>

            <div
              className={`flex items-center gap-4 ${
                theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
              }`}
            >
              <button onClick={() => setCurrentPage('home')} className="hover:underline transition">
                Dashboard
              </button>
              <span>•</span>
              <button
                onClick={() => setCurrentPage('pipe_flow')}
                className="hover:underline transition"
              >
                Pipe Flow
              </button>
              <span>•</span>
              <button
                onClick={() => setCurrentPage('heat_transfer')}
                className="hover:underline transition"
              >
                Heat Transfer
              </button>
              <span>•</span>
              <button
                onClick={() => setCurrentPage('rock_fluid_dashboard')}
                className="hover:underline transition"
              >
                Data Dashboard
              </button>
              <span>•</span>
              <button
                onClick={() => setCurrentPage('verification')}
                className="hover:underline transition"
              >
                Verification
              </button>
            </div>
          </div>

          <div
            className={`border-t pt-4 text-center text-[11px] leading-relaxed ${
              theme === 'dark' ? 'border-white/5 text-zinc-500' : 'border-slate-100 text-slate-500'
            }`}
          >
            <p>
              <strong>Engineering Safety Disclaimer:</strong> This software is intended for educational, preliminary analysis, and engineering-support purposes. Results should be independently verified by a qualified engineer.
            </p>
            <p className="pt-1 opacity-80">
              © {new Date().getFullYear()} Engineering Hub. Built with physical equations, iterative solvers, and explicit verification standards.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

