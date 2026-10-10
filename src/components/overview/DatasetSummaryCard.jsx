import React from 'react';
import { useDataset } from '../../context/DatasetContext';
import { StatCard } from '../common/StatCard';
import {
  Database,
  Layers,
  ShieldCheck,
  Copy,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';

export function DatasetSummaryCard() {
  const { activeDataset, profile } = useDataset();

  if (!activeDataset || !profile) return null;

  return (
    <div className="space-y-6">
      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Observations"
          value={profile.rowCount.toLocaleString()}
          subtext="Processed tabular records"
          icon={Database}
          variant="brand"
        />

        <StatCard
          title="Attributes / Features"
          value={profile.columnCount.toLocaleString()}
          subtext={`${profile.columns.filter(c => c.type === 'number').length} numeric, ${profile.columns.filter(c => c.type === 'string').length} categorical`}
          icon={Layers}
          variant="purple"
        />

        <StatCard
          title="Data Health Score"
          value={`${profile.dataQualityScore}/100`}
          subtext={
            profile.dataQualityScore >= 90
              ? 'High integrity dataset'
              : profile.dataQualityScore >= 70
              ? 'Moderate data hygiene'
              : 'Requires thorough cleaning'
          }
          icon={ShieldCheck}
          variant={profile.dataQualityScore >= 80 ? 'emerald' : profile.dataQualityScore >= 60 ? 'amber' : 'rose'}
        />

        <StatCard
          title="Missing Cells Ratio"
          value={`${profile.missingCellsPercent}%`}
          subtext={`${profile.totalMissingCells} missing / null cells`}
          icon={AlertTriangle}
          variant={profile.missingCellsPercent === 0 ? 'emerald' : 'amber'}
        />
      </div>
    </div>
  );
}
