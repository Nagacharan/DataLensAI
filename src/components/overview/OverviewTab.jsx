import React from 'react';
import { useDataset } from '../../context/DatasetContext';
import { DatasetSummaryCard } from './DatasetSummaryCard';
import { SchemaTable } from './SchemaTable';
import { PreviewTable } from './PreviewTable';
import { Card } from '../common/Card';
import { generateSuggestedQuestions } from '../../utils/insights/deterministicInsightEngine';
import { Sparkles, HelpCircle, ArrowRight, Lightbulb } from 'lucide-react';

export function OverviewTab() {
  const { activeDataset, setActiveTab, handleAskQuestion } = useDataset();

  if (!activeDataset) return null;

  const suggested = generateSuggestedQuestions(activeDataset);

  const handlePromptClick = (question) => {
    handleAskQuestion(question);
    setActiveTab('ask');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <DatasetSummaryCard />

      {/* Contextual Dataset Overview & Suggested Questions */}
      <Card
        title="Dataset Overview & Suggested Explorations"
        subtitle="Automated semantic breakdown and instant analytical inquiries"
        icon={Lightbulb}
        className="border-brand-500/30"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            DataLens AI has normalized <span className="font-semibold text-white">{activeDataset.fileName}</span> into an internal tabular schema with{' '}
            <span className="font-semibold text-brand-300">{activeDataset.totalRows.toLocaleString()} rows</span> and{' '}
            <span className="font-semibold text-brand-300">{activeDataset.totalColumns} columns</span>. 
            Identified <span className="text-white font-medium">{activeDataset.columns.filter(c => c.type === 'number').length} numeric measurement metrics</span>,{' '}
            <span className="text-white font-medium">{activeDataset.columns.filter(c => c.type === 'string').length} categorical dimensions</span>, and{' '}
            <span className="text-white font-medium">{activeDataset.columns.filter(c => c.type === 'date').length} datetime features</span>.
          </p>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Instant Analytical Prompts (Click to Ask):
            </span>
            <div className="flex flex-wrap gap-2">
              {suggested.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(item.question)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-brand-500/60 hover:bg-brand-500/10 text-xs text-slate-200 transition text-left group"
                >
                  <Sparkles className="w-3 h-3 text-brand-400 shrink-0" />
                  <span>{item.question}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Schema Diagnostic Table */}
      <SchemaTable />

      {/* Full Preview Table */}
      <PreviewTable />
    </div>
  );
}
