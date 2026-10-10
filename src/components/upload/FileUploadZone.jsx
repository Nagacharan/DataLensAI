import React, { useState, useRef } from 'react';
import { parseFile, SUPPORTED_EXTENSIONS } from '../../utils/file-parsers';
import { WorksheetSelectorModal } from './WorksheetSelectorModal';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCode,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../common/Button';

export function FileUploadZone({ onDatasetLoaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sheetSelectionData, setSheetSelectionData] = useState(null);
  const fileInputRef = useRef(null);

  const handleProcessFile = async (file) => {
    if (!file) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await parseFile(file);
      if (result.requiresSheetSelection) {
        setSheetSelectionData(result);
        setIsLoading(false);
        return;
      }
      onDatasetLoaded(result);
    } catch (err) {
      console.error('File parsing error:', err);
      setErrorMessage(err.message || 'Failed to parse uploaded dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone Box */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-brand-500 bg-brand-500/10 shadow-glow'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/70'
        } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.json,.tsv"
          className="hidden"
          onChange={onFileInputChange}
        />

        <div className="flex flex-col items-center max-w-md mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="w-12 h-12 text-brand-400 animate-spin mb-4" />
              <h4 className="text-base font-semibold text-slate-100">Analyzing & Ingesting Dataset...</h4>
              <p className="text-xs text-slate-400 mt-1">Deduplicating schema, inferring data types, and calculating health scores...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-semibold text-slate-100">
                Drag and drop your dataset here
              </h3>
              <p className="text-sm text-slate-400 mt-1 mb-5">
                or click to browse from your computer (up to 50MB)
              </p>

              {/* Supported format badges */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-blue-400" /> CSV
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel (.xlsx)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
                  <FileCode className="w-3.5 h-3.5 text-amber-400" /> JSON
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
                  <FileText className="w-3.5 h-3.5 text-purple-400" /> TSV
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error alert if present */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Upload failed: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Excel Multi-Sheet Selector Modal */}
      {sheetSelectionData && (
        <WorksheetSelectorModal
          isOpen={Boolean(sheetSelectionData)}
          onClose={() => setSheetSelectionData(null)}
          sheetData={sheetSelectionData}
          onSheetSelected={(parsed) => {
            onDatasetLoaded(parsed);
            setSheetSelectionData(null);
          }}
        />
      )}
    </div>
  );
}
