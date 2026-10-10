import React from 'react';
import { useDataset } from '../../context/DatasetContext';
import {
  Brain,
  BarChart3,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Sliders,
} from 'lucide-react';

export function NavigationTabs() {
  const {
    activeTab,
    setActiveTab,
    qualityRecommendations,
    cleaningHistory,
    insights,
    mlPrepLog,
  } = useDataset();

  const tabs = [
    {
      id: 'overview',
      label: 'Analyst Overview',
      icon: Brain,
      description: 'Automated understanding & summary',
    },
    {
      id: 'dashboard',
      label: 'Visual Analytics',
      icon: BarChart3,
      description: 'Auto-generated charts & filters',
    },
    {
      id: 'quality',
      label: 'Data Quality',
      icon: ShieldCheck,
      badge: qualityRecommendations.length > 0 ? `${qualityRecommendations.length} fixes` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      description: 'Health audit & 1-click fixes',
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: Sparkles,
      badge: insights.length > 0 ? insights.length : null,
      badgeColor: 'bg-accent-500/20 text-accent-400',
      description: 'Statistical findings & evidence',
    },
    {
      id: 'ask',
      label: 'Ask Your Data',
      icon: HelpCircle,
      description: 'Conversational analytics co-pilot',
    },
    {
      id: 'reports',
      label: 'Executive PDF',
      icon: FileCheck2,
      description: 'Download audited PDF dossier',
    },
    {
      id: 'preparation',
      label: 'ML Prep (Optional)',
      icon: Sliders,
      badge: mlPrepLog.length > 0 ? mlPrepLog.length : 'Opt',
      badgeColor: 'bg-slate-800 text-slate-400',
      description: 'Feature engineering for ML',
    },
  ];

  return (
    <div className="w-full border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
