import React from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  PieChart,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
} from 'lucide-react';

export function InsightsTab() {
  const {
    activeDataset,
    profile,
    insights,
    aiNarrative,
    insightsProvider,
    setActiveTab,
    handleAskQuestion,
  } = useDataset();

  if (!activeDataset || !profile) return null;

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle2;
      case 'trend':
        return TrendingUp;
      case 'info':
      default:
        return PieChart;
    }
  };

  const getCategoryBadgeVariant = (type) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'trend':
        return 'accent';
      default:
        return 'primary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Banner */}
      <div className="glass-card rounded-2xl p-6 border border-brand-500/30 bg-gradient-to-r from-brand-950/40 via-slate-900/60 to-purple-950/30">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-500 to-accent-500 text-white shadow-glow shrink-0 mt-0.5">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Executive Synthesis & Intelligence</h2>
                <Badge variant="accent" size="xs">
                  <BrainCircuit className="w-3 h-3" />
                  {insightsProvider}
                </Badge>
              </div>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {aiNarrative ||
                  `Evaluated ${activeDataset.totalRows.toLocaleString()} rows and ${activeDataset.totalColumns} features from "${activeDataset.fileName}". Analysis identified primary category concentrations, correlations, and distribution parameters.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((ins, index) => {
          const Icon = getInsightIcon(ins.type);
          const badgeVariant = getCategoryBadgeVariant(ins.type);

          return (
            <Card
              key={ins.id || index}
              title={ins.title}
              badge={
                <Badge variant={badgeVariant} size="xs">
                  {ins.category}
                </Badge>
              }
              icon={Icon}
              className="flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {ins.summary}
                </p>

                {/* Evidence Metrics Pill Grid */}
                {ins.evidence && ins.evidence.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    {ins.evidence.map((ev, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs"
                      >
                        <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                          {ev.label}
                        </span>
                        <span className="font-semibold text-slate-100 font-mono text-xs">
                          {ev.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Strategic Recommendation */}
                {ins.recommendation && (
                  <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-brand-200">Recommendation: </span>
                      {ins.recommendation}
                    </div>
                  </div>
                )}

                {/* Ask follow-up about this insight */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      handleAskQuestion(`Tell me more about: ${ins.title}`);
                      setActiveTab('ask');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition"
                  >
                    <span>Investigate this finding</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
