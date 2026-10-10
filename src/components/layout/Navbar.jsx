import React from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Sparkles,
  FileText,
  UploadCloud,
  CheckCircle2,
  Database,
  RotateCcw,
  Cpu,
} from 'lucide-react';
import { generatePDFReport } from '../../utils/reports/pdfGenerator';

export function Navbar({ onUploadClick }) {
  const {
    activeDataset,
    profile,
    insights,
    cleaningHistory,
    mlPrepLog,
    serverConfig,
    insightsProvider,
    resetToRaw,
    canUndo,
    undoLastAction,
  } = useDataset();

  const handleDownloadPDF = () => {
    if (!activeDataset || !profile) return;
    generatePDFReport(activeDataset, profile, insights, cleaningHistory, mlPrepLog);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/90 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-500 flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">DataLens <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-500">AI</span></span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">v1.0 MVP</span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide hidden sm:block">Upload. Understand. Discover.</p>
          </div>
        </div>

        {/* Dataset Status & Actions */}
        <div className="flex items-center gap-3">
          {activeDataset ? (
            <>
              {/* Active File Badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Database className="w-3.5 h-3.5 text-brand-400" />
                <span className="font-medium max-w-[150px] truncate" title={activeDataset.fileName}>
                  {activeDataset.fileName}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{activeDataset.totalRows.toLocaleString()} rows</span>
              </div>

              {/* AI Engine Status Badge */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span>{serverConfig?.aiConfigured ? 'Gemini 1.5' : 'Deterministic Engine'}</span>
              </div>

              {/* Undo Button if available */}
              {canUndo && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={undoLastAction}
                  icon={RotateCcw}
                  title="Undo last cleaning operation"
                >
                  Undo
                </Button>
              )}

              {/* PDF Report Quick Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadPDF}
                icon={FileText}
                className="hidden sm:inline-flex"
              >
                Export PDF
              </Button>

              {/* Upload New File */}
              <Button
                variant="secondary"
                size="sm"
                onClick={onUploadClick}
                icon={UploadCloud}
              >
                Change File
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                <Sparkles className="w-3 h-3" /> Ready for Ingestion
              </Badge>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
