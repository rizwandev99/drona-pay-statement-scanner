import React, { useEffect } from 'react';
import { EvaluationResult } from '../types';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, Clock, MapPin, Smartphone, Zap, CheckCircle2, XCircle } from 'lucide-react';

interface EvidenceInspectorProps {
  result: EvaluationResult | null;
  onClose: () => void;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({ result, onClose }) => {
  // Support closing with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!result) return null;

  const tx = result.transaction;
  const isFraud = result.verdict === 'FRAUD';
  const isSuspicious = result.verdict === 'SUSPICIOUS';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#0b0c10]/95 backdrop-blur-2xl border-l border-white/[0.10] shadow-[-10px_0_40px_rgba(0,0,0,0.8)] flex flex-col transition-transform duration-300 ease-out animate-in slide-in-from-right">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-400">Transaction ID:</span>
            <span className="text-xs font-mono font-semibold text-white bg-white/[0.06] px-2 py-0.5 rounded border border-white/10">
              {tx.id}
            </span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            DronaPay Acharya Inline Decision Trace
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.10] text-neutral-400 hover:text-white transition cursor-pointer"
          title="Close inspector (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 1. Verdict & Risk Score Banner */}
        <div
          className={`rounded-2xl p-5 border flex items-center justify-between gap-4 ${
            isFraud
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.15)]'
              : isSuspicious
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                isFraud
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : isSuspicious
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {isFraud ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : isSuspicious ? (
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-wider font-semibold">
                Official Verdict
              </div>
              <div className="text-xl font-bold font-sans">
                {isFraud ? 'CRITICAL FRAUD (BLOCK)' : isSuspicious ? 'SUSPICIOUS (REVIEW)' : 'APPROVED (SAFE)'}
              </div>
              <div className="text-[11px] font-mono opacity-80 mt-0.5">
                Evaluation Speed: {result.latencyMs} ms (<span className="text-emerald-400">Bank SLA: &lt; 50ms</span>)
              </div>
            </div>
          </div>

          {/* Risk Score Dial */}
          <div className="text-right shrink-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Risk Score
            </div>
            <div className="text-3xl font-extrabold font-mono">
              {result.riskScore}
              <span className="text-sm font-normal text-neutral-500">/100</span>
            </div>
          </div>
        </div>

        {/* 2. Plain-English Executive Reason */}
        <div className="rounded-xl glass-panel p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-white uppercase tracking-wider font-sans">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Plain-English Fraud Evidence</span>
          </div>
          <p className="text-sm text-neutral-200 leading-relaxed font-sans bg-black/40 p-3.5 rounded-lg border border-white/[0.05]">
            "{result.primaryReason}"
          </p>
        </div>

        {/* 3. Rule-by-Rule Audit Breakdown (The 5 Core Heuristics) */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono mb-3">
            Safety Heuristics Audit Checklist ({result.ruleChecks.length} Checks)
          </h3>

          <div className="space-y-2.5">
            {result.ruleChecks.map((rule) => (
              <div
                key={rule.ruleId}
                className={`p-3.5 rounded-xl border transition-all ${
                  rule.triggered
                    ? 'bg-rose-500/[0.06] border-rose-500/30'
                    : 'bg-black/30 border-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 font-medium text-xs text-white">
                    {rule.triggered ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span>{rule.ruleName}</span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                      rule.triggered
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {rule.triggered ? `+${rule.score} Risk Pts` : 'Passed (0 Pts)'}
                  </span>
                </div>

                {/* Plain-English Explanation */}
                <p className="text-xs text-neutral-300 mt-1 pl-6 font-sans leading-relaxed">
                  {rule.explanation}
                </p>

                {/* Technical Threshold vs Observed */}
                <div className="mt-2.5 pt-2 border-t border-white/[0.04] pl-6 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-neutral-400 gap-1">
                  <span>Threshold: <span className="text-neutral-300">{rule.threshold}</span></span>
                  <span>Observed: <span className={rule.triggered ? 'text-rose-300 font-semibold' : 'text-emerald-300'}>{rule.actualValue}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Technical Payment Details */}
        <div className="rounded-xl glass-panel p-4 border border-white/[0.08]">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono mb-3">
            Full Transaction Payload
          </h3>

          <div className="space-y-3 text-xs font-mono">
            {/* Amount & Mode */}
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-neutral-400">Total Amount:</span>
              <span className="font-bold text-white text-base">₹{tx.amount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-neutral-400">Payment Channel:</span>
              <span className="text-neutral-200 px-2 py-0.5 rounded bg-white/[0.04] border border-white/10">{tx.channel}</span>
            </div>

            {/* Sender */}
            <div className="flex flex-col py-2 border-b border-white/[0.04]">
              <span className="text-neutral-400 text-[10px] uppercase">Sender Account:</span>
              <span className="text-white font-sans font-medium mt-0.5">{tx.senderName}</span>
              <span className="text-neutral-400 text-[11px]">{tx.senderVpa}</span>
            </div>

            {/* Receiver */}
            <div className="flex flex-col py-2 border-b border-white/[0.04]">
              <span className="text-neutral-400 text-[10px] uppercase">Beneficiary / Merchant:</span>
              <span className="text-white font-sans font-medium mt-0.5">{tx.receiverName}</span>
              <span className="text-neutral-400 text-[11px]">{tx.receiverVpa}</span>
            </div>

            {/* MCC */}
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-neutral-400">MCC Category:</span>
              <span className="text-neutral-200">{tx.mccCategory} (MCC {tx.mcc})</span>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Timestamp:
              </span>
              <span className="text-neutral-200">{new Date(tx.timestamp).toLocaleString('en-IN')}</span>
            </div>

            {/* Location */}
            <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Geo Location:
              </span>
              <span className="text-neutral-200">{tx.city} ({tx.lat.toFixed(2)}°N, {tx.lon.toFixed(2)}°E)</span>
            </div>

            {/* Device */}
            <div className="flex flex-col py-2 border-b border-white/[0.04]">
              <span className="text-neutral-400 flex items-center gap-1.5 text-[10px] uppercase">
                <Smartphone className="w-3.5 h-3.5" /> Device Fingerprint:
              </span>
              <span className="text-neutral-300 break-all text-[11px] mt-0.5 bg-black/40 p-1.5 rounded border border-white/[0.05]">
                {tx.deviceFingerprint}
              </span>
            </div>

            {/* IP Address */}
            <div className="flex items-center justify-between py-2">
              <span className="text-neutral-400">Client IP Address:</span>
              <span className="text-neutral-200">{tx.ipAddress}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.08] bg-black/60 flex items-center justify-between">
        <span className="text-[11px] font-mono text-neutral-400">
          Evaluated via Drona Pay Core Rule AST
        </span>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-sans transition cursor-pointer"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};
