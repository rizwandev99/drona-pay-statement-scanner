import React from 'react';
import { StatementStats } from '../types';
import { ShieldAlert, ShieldCheck, Gauge, Layers } from 'lucide-react';

interface SummaryRibbonProps {
  stats: StatementStats;
}

export const SummaryRibbon: React.FC<SummaryRibbonProps> = ({ stats }) => {
  const safePercent = stats.totalCount > 0 ? (stats.safeCount / stats.totalCount) * 100 : 0;
  const reviewPercent = stats.totalCount > 0 ? (stats.suspiciousCount / stats.totalCount) * 100 : 0;
  const fraudPercent = stats.totalCount > 0 ? (stats.fraudCount / stats.totalCount) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Scanned Volume */}
      <div className="rounded-2xl glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Total Scanned
          </span>
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-neutral-300" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats.totalCount.toLocaleString()} <span className="text-xs font-normal text-neutral-400">txns</span>
          </div>
          <div className="text-xs font-mono text-neutral-400 mt-1">
            Turnover: <span className="text-neutral-200 font-semibold">₹{stats.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* 2. Total Money at Risk */}
      <div className="rounded-2xl glass-panel p-4 flex flex-col justify-between border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.08)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-rose-300 uppercase tracking-wider">
            Total Money at Risk
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            ₹{stats.amountAtRisk.toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-mono text-neutral-400 mt-1">
            {stats.fraudCount + stats.suspiciousCount} flagged transactions
          </div>
        </div>
      </div>

      {/* 3. Status Breakdown Progress Bar */}
      <div className="rounded-2xl glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Risk Verdict Mix
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
        <div>
          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-neutral-900 overflow-hidden flex mb-2">
            <div style={{ width: `${safePercent}%` }} className="bg-emerald-500 h-full transition-all duration-500" title={`Safe: ${stats.safeCount}`} />
            <div style={{ width: `${reviewPercent}%` }} className="bg-amber-500 h-full transition-all duration-500" title={`Suspicious: ${stats.suspiciousCount}`} />
            <div style={{ width: `${fraudPercent}%` }} className="bg-rose-500 h-full transition-all duration-500" title={`Fraud: ${stats.fraudCount}`} />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-400 font-medium">Safe: {stats.safeCount}</span>
            <span className="text-amber-400 font-medium">Review: {stats.suspiciousCount}</span>
            <span className="text-rose-400 font-medium">Fraud: {stats.fraudCount}</span>
          </div>
        </div>
      </div>

      {/* 4. Engine Scanning Speed */}
      <div className="rounded-2xl glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Avg Engine Latency
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats.avgLatencyMs} <span className="text-xs font-normal text-neutral-400">ms/txn</span>
          </div>
          <div className="text-xs font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Well within 50ms Bank SLA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
