import React from 'react';
import { useDataset } from '../../context/DatasetContext';
import {
  LayoutGrid,
  BarChart3,
  Sparkles,
  Wand2,
  Lightbulb,
  MessageSquare,
  FileText,
  UploadCloud,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

export function SidebarDock({ onUploadClick }) {
  const { activeTab, setActiveTab, canUndo, undoLastAction } = useDataset();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'overview', label: 'Visual Analytics', icon: BarChart3 },
    { id: 'quality', label: 'Data Cleaning', icon: Sparkles },
    { id: 'preparation', label: 'ML Preparation', icon: Wand2 },
    { id: 'insights', label: 'AI Insights', icon: Lightbulb },
    { id: 'ask', label: 'Ask Your Data', icon: MessageSquare },
    { id: 'reports', label: 'PDF Dossier', icon: FileText },
  ];

  return (
    <aside className="bg-[#131618] rounded-[26px] py-4 px-2 w-14 flex flex-col items-center justify-between shadow-2xl shrink-0 my-1">
      {/* Top Nav Group */}
      <div className="flex flex-col items-center gap-3 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'dashboard' && activeTab === 'overview');

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all group relative ${
                isActive
                  ? 'bg-coral-500 text-white shadow-md shadow-coral-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
              title={item.label}
            >
              <Icon className="w-4 h-4" />
              {/* Tooltip on Hover */}
              <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Utility Group */}
      <div className="flex flex-col items-center gap-2.5 pt-4 border-t border-slate-800/80 w-full">
        {canUndo && (
          <button
            onClick={undoLastAction}
            className="w-10 h-10 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-all group relative"
            title="Undo last cleaning operation"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
              Undo Action
            </span>
          </button>
        )}

        <button
          onClick={onUploadClick}
          className="w-10 h-10 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-all group relative"
          title="Upload or change dataset"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
            Change File
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ask')}
          className="w-10 h-10 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-all group relative"
          title="Analytical Assistant"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="absolute left-14 bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
            Data Guide
          </span>
        </button>
      </div>
    </aside>
  );
}
