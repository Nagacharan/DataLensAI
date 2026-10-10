import React, { useState } from 'react';
import { useDataset, DatasetProvider } from './context/DatasetContext';
import { Navbar } from './components/layout/Navbar';
import { SidebarDock } from './components/layout/SidebarDock';
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
import { AlertCircle, Sparkles, Shield, BarChart3, Wand2 } from 'lucide-react';

function MainApplication() {
  const {
    activeDataset,
    loadDataset,
    activeTab,
    error,
    setError,
  } = useDataset();

  const [isChangeFileModalOpen, setIsChangeFileModalOpen] = useState(false);
  const [filterVal, setFilterVal] = useState('ALL');

  const handleDatasetLoaded = (dataset) => {
    loadDataset(dataset);
    setIsChangeFileModalOpen(false);
    setFilterVal('ALL');
  };

  return (
    <div className="min-h-screen bg-[#E6EAE3] p-2.5 sm:p-5 lg:p-7 flex items-center justify-center font-sans antialiased text-slate-800">
      {/* Outer Tablet Frame matching Mockup */}
      <div className="w-full max-w-[1540px] bg-[#CAD5D2] rounded-[36px] p-3.5 sm:p-5 shadow-2xl border border-white/60 flex flex-col gap-3.5 transition-all">
        {/* Top Header Navbar */}
        <Navbar
          onUploadClick={() => setIsChangeFileModalOpen(true)}
          filterCategoryVal={filterVal}
          onFilterChange={setFilterVal}
        />

        {/* Error Alert if any */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-800 font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex gap-3.5 items-stretch min-h-[660px]">
          {/* Left Floating Dark Capsule Dock */}
          {activeDataset && (
            <SidebarDock onUploadClick={() => setIsChangeFileModalOpen(true)} />
          )}

          {/* Crisp Pure White Main Container */}
          <main className="flex-1 bg-white rounded-[28px] p-4 sm:p-6 shadow-sm border border-slate-100/90 overflow-y-auto max-h-[calc(100vh-125px)] scrollbar-none flex flex-col justify-between">
            {!activeDataset ? (
              /* Landing Screen within Clean White Container */
              <div className="py-6 sm:py-10 max-w-4xl mx-auto w-full space-y-8 animate-fade-in text-center">
                <div className="space-y-3 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-coral-600 border border-orange-200/80 text-xs font-semibold shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Autonomous Data Intelligence Co-Pilot</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                    Upload. Understand.{' '}
                    <span className="text-coral-500">Discover.</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    Transform raw spreadsheets into executive analytics, actionable machine-learning preparations, deterministic visualizations, and audited PDF dossiers in seconds.
                  </p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <FileUploadZone onDatasetLoaded={handleDatasetLoaded} />
                </div>

                <div className="pt-2">
                  <SampleDatasetPicker onSelectSample={handleDatasetLoaded} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-left">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-orange-100 text-coral-600 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs">Deterministic Rigor</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Descriptive statistics, correlations, and IQR boundaries computed mathematically without hallucinations.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs">Autonomous Pipeline</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Automatic semantic profiling, quality recommendations, and 1-click batch dataset hygiene repairs.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs">Executive Dossiers</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Multi-page PDF reports containing full visual analytics charts and audit logs page by page.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Loaded Dataset View */
              <div className="flex-1 w-full">
                {activeTab === 'dashboard' && <DashboardTab activeFilterVal={filterVal} />}
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'quality' && <CleaningTab />}
                {activeTab === 'preparation' && <MLPrepTab />}
                {activeTab === 'insights' && <InsightsTab />}
                {activeTab === 'ask' && <AskDataTab />}
                {activeTab === 'reports' && <ReportTab />}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Change File Modal */}
      <Modal
        isOpen={isChangeFileModalOpen}
        onClose={() => setIsChangeFileModalOpen(false)}
        title="Upload or Change Dataset"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5">
          <FileUploadZone onDatasetLoaded={handleDatasetLoaded} />
          <SampleDatasetPicker onSelectSample={handleDatasetLoaded} />
        </div>
      </Modal>
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
