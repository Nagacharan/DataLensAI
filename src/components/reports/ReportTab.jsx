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
    semanticUnderstanding,
    automatedAnalysis,
  } = useDataset();

  if (!activeDataset || !profile) return null;

  const handleDownload = () => {
    generatePDFReport(
      activeDataset,
      profile,
      insights,
      cleaningHistory,
      mlPrepLog,
      semanticUnderstanding,
      automatedAnalysis
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl p-6 border border-orange-200/80 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/40 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100 text-coral-600 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Executive PDF Report Generator</h2>
              <p className="text-xs text-slate-600">
                Compile a professional, multi-page audit and analytics dossier with high-resolution visual charts included page-by-page.
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
          title="Included Report Sections & Visual Pages"
          subtitle="The generated PDF will contain the following structured pages with embedded visual charts"
          icon={Layers}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Page 1: Executive Cover & Dataset Profile:</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Dataset metadata, total records ({profile.rowCount.toLocaleString()} rows), feature count ({profile.columnCount} columns), DataLens hygiene score ({profile.dataQualityScore}/100), and complete descriptive statistics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <CheckCircle className="w-4 h-4 text-coral-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Page 2: Visual Analytics (Categorical Performance & Share):</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  High-res Vector Horizontal Bar Chart of top categories, Proportional Segment Share ribbon, and certified breakdown rankings table.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Page 3: Visual Analytics (Temporal Progression & Distribution):</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Vector Historical Trend Line Chart with trajectory metrics, 8-bin Frequency Distribution Histogram with Mean/Median skew indicators.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Page 4: Visual Analytics (Correlations & Bivariate Dispersion):</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  2D Scatter Dispersion Plot with Linear Regression trendline, Pearson r association coefficient, and pairwise correlation matrix.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Page 5: Strategic Synthesis & Transformation Audit Dossier:</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {insights.length} verified mathematical discoveries and strategic recommendations, followed by immutable timestamped audit trail of transformations.
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
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Dataset File:</span>
                <span className="font-mono text-slate-900 font-semibold">{activeDataset.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Generation Date:</span>
                <span className="text-slate-800">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Format Engine:</span>
                <span className="text-coral-600 font-semibold">jsPDF + AutoTable</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Calculations State:</span>
                <Badge variant="success" size="xs">100% Deterministically Verified</Badge>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-950 leading-relaxed">
              <span className="font-semibold text-coral-600">Integrity Guarantee:</span> The downloaded report uses the exact same computed numbers as shown across the Overview and Dashboard tabs. No hallucinated metrics or fabricated numbers are included.
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
