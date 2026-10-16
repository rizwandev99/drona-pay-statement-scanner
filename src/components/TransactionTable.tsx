import React, { useState, useMemo } from 'react';
import { EvaluationResult, Verdict } from '../types';
import { Search, ChevronLeft, ChevronRight, AlertTriangle, ShieldCheck, ShieldAlert, ArrowUpDown } from 'lucide-react';

interface TransactionTableProps {
  results: EvaluationResult[];
  selectedId?: string;
  onSelect: (result: EvaluationResult) => void;
}

type FilterOption = 'ALL' | Verdict;
type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC' | 'RISK_DESC';

export const TransactionTable: React.FC<TransactionTableProps> = ({
  results,
  selectedId,
  onSelect
}) => {
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('RISK_DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Filter and Search Logic
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      // 1. Status Filter
      if (filter !== 'ALL' && item.verdict !== filter) return false;

      // 2. Search Query
      if (search.trim()) {
        const query = search.toLowerCase();
        const tx = item.transaction;
        const matches =
          tx.id.toLowerCase().includes(query) ||
          tx.senderName.toLowerCase().includes(query) ||
          tx.senderVpa.toLowerCase().includes(query) ||
          tx.receiverName.toLowerCase().includes(query) ||
          tx.receiverVpa.toLowerCase().includes(query) ||
          tx.city.toLowerCase().includes(query) ||
          tx.mccCategory.toLowerCase().includes(query) ||
          tx.amount.toString().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [results, filter, search]);

  // Sorting Logic
  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      switch (sortBy) {
        case 'RISK_DESC':
          return b.riskScore - a.riskScore;
        case 'AMOUNT_DESC':
          return b.transaction.amount - a.transaction.amount;
        case 'AMOUNT_ASC':
          return a.transaction.amount - b.transaction.amount;
        case 'DATE_DESC':
          return new Date(b.transaction.timestamp).getTime() - new Date(a.transaction.timestamp).getTime();
        case 'DATE_ASC':
          return new Date(a.transaction.timestamp).getTime() - new Date(b.transaction.timestamp).getTime();
        default:
          return 0;
      }
    });
  }, [filteredResults, sortBy]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(sortedResults.length / pageSize));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedResults.slice(start, start + pageSize);
  }, [sortedResults, currentPage]);

  const counts = useMemo(() => {
    return {
      all: results.length,
      fraud: results.filter((r) => r.verdict === 'FRAUD').length,
      suspicious: results.filter((r) => r.verdict === 'SUSPICIOUS').length,
      safe: results.filter((r) => r.verdict === 'SAFE').length,
    };
  }, [results]);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="rounded-2xl glass-panel p-5 border border-white/[0.08]">
      {/* Table Controls Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setFilter('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer border ${
              filter === 'ALL'
                ? 'bg-white/10 border-white/20 text-white shadow-sm'
                : 'bg-black/30 border-white/[0.05] text-neutral-400 hover:text-white'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => { setFilter('FRAUD'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer border ${
              filter === 'FRAUD'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : 'bg-black/30 border-white/[0.05] text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Fraud ({counts.fraud})</span>
          </button>
          <button
            onClick={() => { setFilter('SUSPICIOUS'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer border ${
              filter === 'SUSPICIOUS'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-black/30 border-white/[0.05] text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Review ({counts.suspicious})</span>
          </button>
          <button
            onClick={() => { setFilter('SAFE'); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer border ${
              filter === 'SAFE'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-black/30 border-white/[0.05] text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safe ({counts.safe})</span>
          </button>
        </div>

        {/* Search Input & Sort Dropdown */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search beneficiary, UPI, city..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 font-sans"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs font-mono text-neutral-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="RISK_DESC" className="bg-neutral-900">Risk: High to Low</option>
              <option value="AMOUNT_DESC" className="bg-neutral-900">Amount: High to Low</option>
              <option value="AMOUNT_ASC" className="bg-neutral-900">Amount: Low to High</option>
              <option value="DATE_DESC" className="bg-neutral-900">Date: Newest First</option>
              <option value="DATE_ASC" className="bg-neutral-900">Date: Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Data Table */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              <th className="py-3 px-3">Verdict</th>
              <th className="py-3 px-3">Risk Score</th>
              <th className="py-3 px-3">Date / Time</th>
              <th className="py-3 px-3">Beneficiary / Merchant</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">City</th>
              <th className="py-3 px-3 text-right">Amount (₹)</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {paginatedResults.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-400 font-sans">
                  No transactions match the selected filter or search query.
                </td>
              </tr>
            ) : (
              paginatedResults.map((item) => {
                const tx = item.transaction;
                const isSelected = selectedId === tx.id;
                const isFraud = item.verdict === 'FRAUD';
                const isSuspicious = item.verdict === 'SUSPICIOUS';

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelect(item)}
                    className={`transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-white/[0.08] border-l-2 border-emerald-400'
                        : isFraud
                        ? 'hover:bg-rose-500/[0.04]'
                        : isSuspicious
                        ? 'hover:bg-amber-500/[0.04]'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isFraud ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          FRAUD
                        </span>
                      ) : isSuspicious ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          REVIEW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          SAFE
                        </span>
                      )}
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono">
                      <span
                        className={`font-semibold ${
                          item.riskScore >= 65
                            ? 'text-rose-400'
                            : item.riskScore >= 30
                            ? 'text-amber-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {item.riskScore}
                      </span>
                      <span className="text-[10px] text-neutral-500">/100</span>
                    </td>

                    {/* Date / Time */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-neutral-300">
                      {formatDateTime(tx.timestamp)}
                    </td>

                    {/* Beneficiary */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-white line-clamp-1">{tx.receiverName}</div>
                      <div className="text-[10px] font-mono text-neutral-400 line-clamp-1">{tx.receiverVpa}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-neutral-300">{tx.mccCategory}</span>
                      <span className="text-[10px] font-mono text-neutral-500 ml-1">({tx.mcc})</span>
                    </td>

                    {/* City */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-neutral-300">
                      {tx.city}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 whitespace-nowrap text-right font-mono font-semibold text-white">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                        className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition cursor-pointer border border-emerald-500/20"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.06] text-xs font-mono text-neutral-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedResults.length)} of {sortedResults.length} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
