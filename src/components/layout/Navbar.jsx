import React, { useState } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Button } from '../common/Button';
import {
  Bell,
  MessageSquare,
  UploadCloud,
  FileText,
  ChevronDown,
  Sparkles,
  Database,
  Calendar,
  Layers,
} from 'lucide-react';
import { generatePDFReport } from '../../utils/reports/pdfGenerator';

export function Navbar({ onUploadClick, filterCategoryVal, onFilterChange }) {
  const {
    activeDataset,
    profile,
    insights,
    cleaningHistory,
    mlPrepLog,
    semanticUnderstanding,
    automatedAnalysis,
    activeTab,
    setActiveTab,
  } = useDataset();

  const [dateRange, setDateRange] = useState('Last 365 days');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Extract top categorical options from dataset for header filter pills
  const catCol = semanticUnderstanding?.primaryCategory?.name || activeDataset?.columns.find(c => c.type === 'string')?.name;
  const uniqueCategories = React.useMemo(() => {
    if (!activeDataset?.rows || !catCol) return [];
    const set = new Set();
    activeDataset.rows.forEach(r => {
      const val = r[catCol];
      if (val !== null && val !== undefined && val !== '') set.add(String(val));
    });
    return Array.from(set).slice(0, 5);
  }, [activeDataset?.rows, catCol]);

  const handleDownloadPDF = () => {
    if (!activeDataset || !profile) return;
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

  const notificationCount = profile?.duplicateRowsCount || profile?.totalMissingCells ? 2 : 1;

  return (
    <header className="w-full flex items-center justify-between gap-4 py-2 px-1">
      {/* Left: Brand Icon + Title */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-2xl bg-white shadow-sm border border-slate-200/80 flex items-center justify-center text-slate-800">
          <svg className="w-5 h-5 text-slate-800 fill-current" viewBox="0 0 24 24">
            <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 capitalize">
            {activeTab === 'dashboard' || activeTab === 'overview' ? 'Dashboard' : activeTab}
          </h1>
        </div>
      </div>

      {/* Middle: Horizontal Filter Pills (Matching Mockup) */}
      {activeDataset && (
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-2xl">
          <button
            onClick={() => onFilterChange && onFilterChange('ALL')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              !filterCategoryVal || filterCategoryVal === 'ALL'
                ? 'bg-coral-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            All Records
          </button>

          {uniqueCategories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => onFilterChange && onFilterChange(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all truncate max-w-[140px] ${
                filterCategoryVal === cat
                  ? 'bg-coral-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Right: Date Range Pill, Notifications, Chat, Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Date Filter Pill */}
        <div className="relative">
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showDateDropdown && (
            <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border border-slate-100 shadow-xl py-1.5 z-50 text-xs font-medium text-slate-700">
              {['Last 30 days', 'Last 90 days', 'Last 365 days', 'All recorded time'].map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDateRange(item);
                    setShowDateDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-orange-50 hover:text-coral-600 transition"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Pill with Badge */}
        <div className="relative">
          <button
            onClick={() => setActiveTab('quality')}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
            title="Quality notifications"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-coral-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {notificationCount}
            </span>
          </button>
        </div>

        {/* Chat / Ask Co-pilot Icon */}
        <button
          onClick={() => setActiveTab('ask')}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
            activeTab === 'ask'
              ? 'bg-coral-500 text-white shadow-sm'
              : 'bg-slate-200/70 hover:bg-slate-200 text-slate-700'
          }`}
          title="Ask Your Data Co-Pilot"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Quick Export PDF */}
        <button
          onClick={handleDownloadPDF}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
          title="Export Executive PDF Report"
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>Export PDF</span>
        </button>

        {/* Change File / Upload Avatar */}
        <button
          onClick={onUploadClick}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-coral-500 to-amber-400 text-white flex items-center justify-center shadow-sm hover:opacity-95 transition"
          title={activeDataset ? `Dataset: ${activeDataset.fileName} (Click to change)` : 'Upload dataset'}
        >
          <UploadCloud className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
