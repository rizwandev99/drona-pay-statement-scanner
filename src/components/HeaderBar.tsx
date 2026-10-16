import React from 'react';
import { ShieldCheck, RotateCcw, Activity } from 'lucide-react';

interface HeaderBarProps {
  totalScanned: number;
  onReset: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ totalScanned, onReset }) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#07080a]/90 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Sub-System Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white font-sans">
                DronaPay Acharya
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                BFSI Core Engine
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans hidden sm:block">
              Bank Statement & UPI Transaction Risk Scanner • Sub-50ms Defense
            </p>
          </div>
        </div>

        {/* Live System Indicator & Reset */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs font-mono text-neutral-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Switch Status: </span>
            <span className="text-emerald-400 font-semibold">Active In-Line</span>
          </div>

          {totalScanned > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-neutral-300 hover:text-white transition cursor-pointer font-sans"
              title="Clear current statement and reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
