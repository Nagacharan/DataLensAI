import React from 'react';
import { useDataset } from '../../context/DatasetContext';
import { DatasetSummaryCard } from './DatasetSummaryCard';
import { SchemaTable } from './SchemaTable';
import { PreviewTable } from './PreviewTable';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { generateSuggestedQuestions } from '../../utils/insights/deterministicInsightEngine';
import {
  Brain,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Wand2,
  ArrowRight,
  TrendingUp,
  Database,
  BarChart2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

export function OverviewTab() {
  const {
    activeDataset,
    profile,
    semanticUnderstanding,
    qualityRecommendations,
    applyAllQualityRecommendations,
    insights,
    aiNarrative,
    insightsProvider,
    setActiveTab,
    handleAskQuestion,
    canUndo,
    undoLastAction,
    cleaningHistory,
  } = useDataset();

  if (!activeDataset || !profile || !semanticUnderstanding) return null;

  const suggested = generateSuggestedQuestions(activeDataset);

  const handlePromptClick = (question) => {
    handleAskQuestion(question);
    setActiveTab('ask');
  };

  const primaryMetric = semanticUnderstanding.primaryMetric;
  const primaryCat = semanticUnderstanding.primaryCategory;

  return (
    <div className="space-y-6">
      {/* 1. Intelligent Analyst Executive Briefing */}
      <div className="glass-card rounded-2xl p-6 border border-brand-500/30 bg-gradient-to-r from-brand-950/40 via-slate-900/70 to-purple-950/30 shadow-xl">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold">
                <Brain className="w-3.5 h-3.5 text-brand-400" />
                Autonomous Analyst Briefing
              </span>
              <Badge variant="accent" size="xs">
                {insightsProvider}
              </Badge>
              <Badge variant="neutral" size="xs">
                {semanticUnderstanding.domainHint}
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Executive Understanding of "{activeDataset.fileName}"
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
              {aiNarrative || semanticUnderstanding.executiveSummary}
            </p>

            {/* Inferred Roles & Observed Facts Quick Pills */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              {primaryMetric && (
                <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 mr-1.5">Primary Metric:</span>
                  <span className="font-semibold text-brand-300 font-mono">{primaryMetric.name}</span>
                </div>
              )}
              {primaryCat && (
                <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 mr-1.5">Key Segment:</span>
                  <span className="font-semibold text-emerald-300 font-mono">{primaryCat.name}</span>
                </div>
              )}
              {semanticUnderstanding.primaryDate && (
                <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 mr-1.5">Timeline:</span>
                  <span className="font-semibold text-amber-300 font-mono">{semanticUnderstanding.primaryDate.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-row md:flex-col items-center md:items-end gap-2.5 shrink-0 w-full md:w-auto justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveTab('dashboard')}
              icon={BarChart2}
              className="w-full md:w-auto"
            >
              Explore Dashboard
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveTab('ask')}
              icon={HelpCircle}
              className="w-full md:w-auto"
            >
              Ask Questions
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Automated Quality Health & 1-Click Action Banner */}
      {qualityRecommendations.length > 0 ? (
        <div className="glass-card rounded-2xl p-5 border border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/60 shadow-lg">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">Automated Data Quality Assessment</h3>
                  <Badge variant="warning" size="xs">
                    {qualityRecommendations.length} Recommended Fixes
                  </Badge>
                  <span className="text-xs text-slate-400">
                    (Health Score: {profile.dataQualityScore}/100)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  We identified {profile.totalMissingCells} missing cells and {profile.duplicateRowsCount} duplicate rows.
                  DataLens has generated tailored, non-destructive cleaning actions to maximize analytical accuracy.
                </p>

                {/* Recommendation Snippet Pills */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {qualityRecommendations.slice(0, 3).map((rec, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-amber-500/30 text-[11px] text-amber-200"
                    >
                      <CheckCircle2 className="w-3 h-3 text-amber-400" />
                      <span>{rec.title}</span>
                    </span>
                  ))}
                  {qualityRecommendations.length > 3 && (
                    <span className="text-[11px] text-slate-400 self-center">
                      +{qualityRecommendations.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 1-Click Fix Button */}
            <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
              <Button
                variant="primary"
                size="md"
                onClick={applyAllQualityRecommendations}
                icon={Wand2}
                className="bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 text-slate-950 font-semibold shadow-glow"
              >
                Apply All Recommended Fixes (1-Click)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('quality')}
              >
                Review Fixes
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-4 border border-emerald-500/30 bg-emerald-950/15 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-white text-xs sm:text-sm">
                High Integrity Dataset — Pristine Data Quality
              </span>
              <span className="text-xs text-slate-400 block sm:inline sm:ml-2">
                0 missing cells, 0 duplicates, and verified types. Health Score: 100/100.
              </span>
            </div>
          </div>
          {cleaningHistory.length > 0 && canUndo && (
            <Button
              variant="secondary"
              size="sm"
              onClick={undoLastAction}
              icon={RotateCcw}
            >
              Undo Last Fix
            </Button>
          )}
        </div>
      )}

      {/* 3. Core KPI Cards */}
      <DatasetSummaryCard />

      {/* 4. Automated Top Insights Highlights */}
      {insights.length > 0 && (
        <Card
          title="Automated Key Findings & Insights"
          subtitle="Grounded strictly in verified mathematical computations (Pareto volume, correlations, and shifts)"
          icon={Sparkles}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('insights')}
              className="text-brand-400 hover:text-brand-300"
            >
              View All {insights.length} Insights <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 2).map((ins, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-slate-100">{ins.title}</span>
                    <Badge variant="primary" size="xs">{ins.category}</Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{ins.summary}</p>
                </div>

                {ins.evidence && ins.evidence.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    {ins.evidence.slice(0, 2).map((ev, i) => (
                      <div key={i} className="text-[11px] p-1.5 rounded bg-slate-950 border border-slate-850">
                        <span className="text-slate-400 block text-[9px] uppercase">{ev.label}</span>
                        <span className="font-semibold text-brand-300 font-mono">{ev.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Instant Analytical Prompts Bar */}
      <Card
        title="Suggested Inquiries & Instant Co-Pilot Prompts"
        subtitle="Click any question to immediately compute and explain verified answers"
        icon={HelpCircle}
        className="border-slate-800"
      >
        <div className="flex flex-wrap gap-2">
          {suggested.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(item.question)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/60 hover:bg-brand-500/10 text-xs text-slate-200 transition text-left group"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>{item.question}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          ))}
        </div>
      </Card>

      {/* 6. Semantic Understanding vs Observed Facts Schema Table */}
      <SchemaTable />

      {/* 7. Full Interactive Preview Table */}
      <PreviewTable />
    </div>
  );
}
