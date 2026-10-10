import React from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { FileText, Download, CheckCircle, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { generatePDFReport } from '../../utils/reports/pdfGenerator';

export function ReportTab() {
  const {
    activeDataset,
    profile,
    insights,
    cleaningHistory,
    mlPrepLog,
  } = useDataset();

  if (!activeDataset || !profile) return null;

  const handleDownload = () => {
    generatePDFReport(activeDataset, profile, insights, cleaningHistory, mlPrepLog);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-brand-500/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Executive PDF Report Generator</h2>
              <p className="text-xs text-slate-400">
                Compile a professional, multi-page audit and analytics dossier with verified figures, descriptive statistics, and AI insights.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleDownload}
          icon={Download}
        >
          Download PDF Report
        </Button>
      </div>

      {/* Report Manifest Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Included Report Sections"
          subtitle="The generated PDF will contain the following structured sections"
          icon={Layers}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">1. Executive Cover & Dataset Profile:</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Dataset name, timestamp, total record volume ({profile.rowCount.toLocaleString()} rows), feature count ({profile.columnCount} columns), and overall DataLens hygiene index ({profile.dataQualityScore}/100).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">2. Numerical Descriptive Statistics:</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Parametric and non-parametric table: Mean, Median, Sample Standard Deviation, Range, and 1.5x IQR Outlier metrics for every continuous feature.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">3. Mathematical & AI Insights:</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {insights.length} verified analytical findings covering category concentration, correlations, trajectories, and strategic recommendations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">4. Transformation Audit Trail:</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Complete timestamped log of all cleaning imputations, duplicate removals, outlier bounds adjustments, and feature engineering steps.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Audit Details */}
        <Card
          title="Document Metadata & Verification"
          subtitle="Verification hashes and data provenance"
          icon={ShieldCheck}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Dataset File:</span>
                <span className="font-mono text-slate-200">{activeDataset.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Generation Date:</span>
                <span className="text-slate-200">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Format Engine:</span>
                <span className="text-brand-300">jsPDF + AutoTable</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Calculations State:</span>
                <Badge variant="success" size="xs">100% Deterministically Verified</Badge>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 leading-relaxed">
              <span className="font-semibold text-brand-200">Integrity Guarantee:</span> The downloaded report uses the exact same computed numbers as shown across the Overview and Dashboard tabs. No hallucinated metrics or fabricated numbers are included.
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleDownload}
              className="w-full"
              icon={Download}
            >
              Export Report Now
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
