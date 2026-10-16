import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { generateSampleCsvTemplate } from '../engine/csvParser';

interface StatementUploaderProps {
  onFileUpload: (csvText: string, fileName: string) => void;
  onLoadSample: () => void;
  loadedFileName?: string;
  totalRecords?: number;
  isScanning?: boolean;
}

export const StatementUploader: React.FC<StatementUploaderProps> = ({
  onFileUpload,
  onLoadSample,
  loadedFileName,
  totalRecords,
  isScanning
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      alert('Please upload a valid .csv bank statement file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onFileUpload(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateSampleCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'DronaPay_Bank_Statement_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl glass-panel p-5 border border-white/[0.08] transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white font-sans">
              Statement Ingestion & Fraud Scanner
            </h2>
          </div>
          <p className="text-xs text-neutral-400 font-sans">
            Upload any bank statement or UPI transaction spreadsheet to scan for velocity attacks, mule accounts, and fraud patterns.
          </p>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onLoadSample}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium font-sans transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Load 250 Sample Transactions</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white text-xs font-sans transition cursor-pointer"
            title="Download CSV format template"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Template</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10'
            : loadedFileName
            ? 'border-emerald-500/30 bg-black/30 hover:border-emerald-500/50'
            : 'border-white/[0.12] bg-black/20 hover:border-white/25 hover:bg-white/[0.02]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".csv,text/csv"
          className="hidden"
        />

        {loadedFileName ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white font-mono">{loadedFileName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {totalRecords} Records Scanned
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Click or drag another .csv file to re-scan with fresh data
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-2.5">
              <UploadCloud className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-xs md:text-sm font-medium text-white font-sans">
              Drag & drop your bank statement CSV here, or <span className="text-emerald-400 underline underline-offset-2">browse files</span>
            </p>
            <p className="text-[11px] text-neutral-400 font-mono mt-1">
              Supports standard bank exports (UPI Ref, Date, Amount, Beneficiary, MCC, City)
            </p>
          </>
        )}
      </div>
    </div>
  );
};
