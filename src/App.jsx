import React, { useState } from 'react';
import { useDataset, DatasetProvider } from './context/DatasetContext';
import { Navbar } from './components/layout/Navbar';
import { NavigationTabs } from './components/layout/NavigationTabs';
import { FileUploadZone } from './components/upload/FileUploadZone';
import { SampleDatasetPicker } from './components/upload/SampleDatasetPicker';
import { OverviewTab } from './components/overview/OverviewTab';
import { CleaningTab } from './components/data-cleaning/CleaningTab';
import { MLPrepTab } from './components/ml-preparation/MLPrepTab';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { InsightsTab } from './components/insights/InsightsTab';
import { AskDataTab } from './components/ask-data/AskDataTab';
import { ReportTab } from './components/reports/ReportTab';
import { Modal } from './components/common/Modal';
import { AlertCircle, Sparkles, Shield, BarChart3, Database, FileSpreadsheet, Wand2 } from 'lucide-react';

function MainApplication() {
  const {
    activeDataset,
    loadDataset,
    activeTab,
    error,
    setError,
  } = useDataset();

  const [isChangeFileModalOpen, setIsChangeFileModalOpen] = useState(false);

  const handleDatasetLoaded = (dataset) => {
    loadDataset(dataset);
    setIsChangeFileModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar onUploadClick={() => setIsChangeFileModalOpen(true)} />

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-start justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!activeDataset ? (
        /* Landing / Upload Screen */
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full space-y-12">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Autonomous Data Intelligence Co-Pilot</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Upload. Understand.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-300 to-accent-500">
                Discover.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Transform raw spreadsheets into executive analytics, actionable machine-learning preparations, deterministic visualizations, and audited PDF reports in seconds.
            </p>
          </div>

          {/* Upload Zone */}
          <div className="max-w-3xl mx-auto">
            <FileUploadZone onDatasetLoaded={handleDatasetLoaded} />
          </div>

          {/* Sample Datasets */}
          <div className="max-w-5xl mx-auto">
            <SampleDatasetPicker onSelectSample={handleDatasetLoaded} />
          </div>

          {/* Core Feature Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6 border-t border-slate-800/80">
            <div className="glass-card rounded-xl p-5 border border-slate-800/80 space-y-2">
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 w-fit">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Deterministic Mathematical Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Descriptive stats, correlations, and IQR boundaries are deterministically computed in JavaScript. Zero hallucinated metrics.
              </p>
            </div>

            <div className="glass-card rounded-xl p-5 border border-slate-800/80 space-y-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
                <Wand2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Quality Cleaning & ML Preparation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Impute nulls, cap outliers, encode categorical features, normalize scales, and detect data leakage with full rollback.
              </p>
            </div>

            <div className="glass-card rounded-xl p-5 border border-slate-800/80 space-y-2">
              <div className="p-2 rounded-lg bg-accent-500/10 text-accent-400 border border-accent-500/20 w-fit">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Ask Your Data & PDF Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Query your data in plain English with evidence badges, interactive Recharts visualizations, and 1-click executive PDF dossiers.
              </p>
            </div>
          </div>
        </main>
      ) : (
        /* Loaded Dataset Active Workspace */
        <div className="flex-1 flex flex-col">
          <NavigationTabs />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'quality' && <CleaningTab />}
            {activeTab === 'preparation' && <MLPrepTab />}
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'insights' && <InsightsTab />}
            {activeTab === 'ask' && <AskDataTab />}
            {activeTab === 'reports' && <ReportTab />}
          </main>
        </div>
      )}

      {/* Change File Modal */}
      <Modal
        isOpen={isChangeFileModalOpen}
        onClose={() => setIsChangeFileModalOpen(false)}
        title="Upload or Change Dataset"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          <FileUploadZone onDatasetLoaded={handleDatasetLoaded} />
          <SampleDatasetPicker onSelectSample={handleDatasetLoaded} />
        </div>
      </Modal>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 glass-panel mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>DataLens AI — Upload. Understand. Discover.</span>
          <span>Engineered for Reliability & Deterministic Mathematical Rigor</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <DatasetProvider>
      <MainApplication />
    </DatasetProvider>
  );
}
