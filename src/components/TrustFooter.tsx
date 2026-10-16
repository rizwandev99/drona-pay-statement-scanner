import React from 'react';
import { ShieldCheck, Cpu, Database, Lock } from 'lucide-react';

export const TrustFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-black/60 mt-12 py-8 text-neutral-400 font-sans text-xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
          {/* Architecture Pillars */}
          <div className="flex items-center gap-6 flex-wrap justify-center md:justify-start">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Sub-50ms Inline Execution SLA</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>PostgreSQL & SQL-Compliant Schema</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>Zero-Data-Retention Privacy Mode</span>
            </div>
          </div>

          {/* Standards & Certifications */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500">
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">NPCI UPI 2.0</span>
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">RBI CSF Compliant</span>
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">ISO 27001</span>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-neutral-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>DronaPay Acharya • Proof-of-Work Engineering Reference</span>
          </div>
          <div>Built for Mumbai / Remote India Fullstack Engineering</div>
        </div>
      </div>
    </footer>
  );
};
