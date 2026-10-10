import React, { useState } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge, ColumnTypeBadge } from '../common/Badge';
import {
  Sliders,
  Target,
  Binary,
  Maximize2,
  Calendar,
  AlertTriangle,
  Download,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  inspectFeaturesForML,
  detectLeakageRisks,
  exportToCSVText,
} from '../../utils/data-preparation/mlPreparer';

export function MLPrepTab() {
  const {
    activeDataset,
    profile,
    mlPreparedDataset,
    mlPrepLog,
    mlTargetColumn,
    setMlTargetColumn,
    initMLDataset,
    applyMLEncoding,
    applyMLScaling,
    applyMLDateDerivation,
  } = useDataset();

  const [selectedEncodeCol, setSelectedEncodeCol] = useState(
    activeDataset?.columns.find(c => c.type === 'string' && !c.isIdentifier)?.name || ''
  );
  const [encodeMethod, setEncodeMethod] = useState('one_hot');

  const [selectedScaleCol, setSelectedScaleCol] = useState(
    activeDataset?.columns.find(c => c.type === 'number' && !c.isIdentifier)?.name || ''
  );
  const [scaleMethod, setScaleMethod] = useState('standardize');

  const [selectedDateCol, setSelectedDateCol] = useState(
    activeDataset?.columns.find(c => c.type === 'date')?.name || ''
  );

  if (!activeDataset) return null;

  const features = inspectFeaturesForML(activeDataset, mlTargetColumn);
  const leakageRisks = detectLeakageRisks(activeDataset, mlTargetColumn);

  const handleDownloadPreparedCSV = () => {
    const csv = exportToCSVText(mlPreparedDataset.rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ml_prepared_${activeDataset.fileName || 'data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const catCols = activeDataset.columns.filter(c => c.type === 'string' && !c.isIdentifier);
  const numCols = activeDataset.columns.filter(c => c.type === 'number' && !c.isIdentifier);
  const dateCols = activeDataset.columns.filter(c => c.type === 'date');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Prediction-Ready Feature Engineering</h2>
              <p className="text-xs text-slate-400">
                Prepare tabular datasets for machine learning workflows (No model training or automated predictions).
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleDownloadPreparedCSV}
          icon={Download}
        >
          Download Prepared CSV ({mlPreparedDataset.rows.length} rows, {mlPreparedDataset.columns.length} cols)
        </Button>
      </div>

      {/* Target Designation & Data Leakage Awareness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Target Variable Designation"
          subtitle="Select the primary outcome or dependent variable for future ML modeling"
          icon={Target}
          className="border-brand-500/30"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Designated Target Column:
              </label>
              <select
                value={mlTargetColumn || ''}
                onChange={(e) => setMlTargetColumn(e.target.value || null)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">-- No Target (Unsupervised / Clustering) --</option>
                {activeDataset.columns.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Target Role Guidelines:</span> Designation of target column determines whether downstream tasks are classification (categorical target) or regression (continuous numerical target). Target values are isolated from feature engineering transformations.
            </div>
          </div>
        </Card>

        {/* Data Leakage Alert */}
        <Card
          title="Data Leakage Awareness"
          subtitle="Heuristic checks for proxy variables and post-event information leakage"
          icon={ShieldAlert}
          className={leakageRisks.length > 0 ? 'border-amber-500/40' : 'border-emerald-500/20'}
        >
          {leakageRisks.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>
                {mlTargetColumn
                  ? `No obvious target leakage risks detected for "${mlTargetColumn}".`
                  : 'Select a target variable to analyze potential leakage patterns.'}
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {leakageRisks.map((risk, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Risk in "{risk.column}": </span>
                    {risk.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Feature Engineering Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Categorical Encoding */}
        <Card
          title="Categorical Encoding"
          subtitle="Transform discrete categories into numerical features"
          icon={Binary}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Select Categorical Column:</label>
              <select
                value={selectedEncodeCol}
                onChange={(e) => setSelectedEncodeCol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                {catCols.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.uniqueCount} unique)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Encoding Method:</label>
              <select
                value={encodeMethod}
                onChange={(e) => setEncodeMethod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="one_hot">One-Hot Encoding (Binary indicators)</option>
                <option value="label">Label / Ordinal Encoding (Integer indices)</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-500">
              One-Hot is optimal for nominal categories (e.g. Region, Color); Label is suitable for ordered classes or tree-based algorithms.
            </p>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => applyMLEncoding(selectedEncodeCol, encodeMethod)}
              disabled={!selectedEncodeCol}
              className="w-full"
            >
              Encode Feature
            </Button>
          </div>
        </Card>

        {/* 2. Numerical Feature Scaling */}
        <Card
          title="Numerical Feature Scaling"
          subtitle="Calibrate scale and variance of continuous inputs"
          icon={Maximize2}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Select Numeric Column:</label>
              <select
                value={selectedScaleCol}
                onChange={(e) => setSelectedScaleCol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                {numCols.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Scaling Strategy:</label>
              <select
                value={scaleMethod}
                onChange={(e) => setScaleMethod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="standardize">Standardization (Z-score: mean=0, std=1)</option>
                <option value="min_max">Min-Max Normalization (Bounded in [0, 1])</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-500">
              Scaling is crucial for distance-based estimators (KNN, SVM, Neural Nets) but non-essential for decision trees.
            </p>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => applyMLScaling(selectedScaleCol, scaleMethod)}
              disabled={!selectedScaleCol}
              className="w-full"
            >
              Scale Feature
            </Button>
          </div>
        </Card>

        {/* 3. Date Feature Extraction */}
        <Card
          title="Date & Time Decomposition"
          subtitle="Extract calendar features from timestamps"
          icon={Calendar}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Select Datetime Column:</label>
              <select
                value={selectedDateCol}
                onChange={(e) => setSelectedDateCol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                {dateCols.length > 0 ? (
                  dateCols.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))
                ) : (
                  <option value="">No date columns available</option>
                )}
              </select>
            </div>

            <p className="text-[11px] text-slate-500">
              Derives 5 engineered features: Year, Month (1-12), Day of Month, Day of Week (0-6), and IsWeekend flag (0 or 1).
            </p>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => applyMLDateDerivation(selectedDateCol)}
              disabled={!selectedDateCol}
              className="w-full"
            >
              Decompose Temporal Feature
            </Button>
          </div>
        </Card>
      </div>

      {/* Feature Candidate Inspection Table */}
      <Card
        title="Feature Candidate Overview & Recommended Roles"
        subtitle="Current status of all attributes in prepared dataset"
        icon={Sliders}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">Feature Name</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Suggested Role</th>
                <th className="py-2.5 px-4">ML Preparation Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {features.map((feat) => (
                <tr key={feat.name} className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-100">
                    {feat.name}
                  </td>
                  <td className="py-2.5 px-4">
                    <ColumnTypeBadge type={feat.type} />
                  </td>
                  <td className="py-2.5 px-4">
                    {feat.suggestedRole === 'target' ? (
                      <Badge variant="accent" size="xs">TARGET</Badge>
                    ) : feat.suggestedRole === 'ignore' ? (
                      <Badge variant="warning" size="xs">EXCLUDE</Badge>
                    ) : (
                      <Badge variant="primary" size="xs">{feat.suggestedRole.toUpperCase()}</Badge>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                    {feat.prepRecommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit Log for ML Prep */}
      {mlPrepLog.length > 0 && (
        <Card
          title="Feature Engineering Action Log"
          subtitle="Transformations applied to prepared dataset"
          icon={CheckCircle}
        >
          <div className="space-y-2">
            {mlPrepLog.map((log, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="accent" size="xs">{log.type}</Badge>
                  <span className="text-slate-200">{log.description}</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
