import React, { useState } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Wand2,
  Trash2,
  Copy,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  History,
} from 'lucide-react';

export function CleaningTab() {
  const {
    activeDataset,
    profile,
    cleaningHistory,
    applyCleaningAction,
    undoLastAction,
    canUndo,
    resetToRaw,
  } = useDataset();

  // Active form state for operations
  const [selectedMissingCol, setSelectedMissingCol] = useState(
    profile?.columns.find(c => c.nullCount > 0)?.name || profile?.columns[0]?.name || ''
  );
  const [missingStrategy, setMissingStrategy] = useState('mean');
  const [constantVal, setConstantVal] = useState('');

  const [selectedTypeCol, setSelectedTypeCol] = useState(profile?.columns[0]?.name || '');
  const [targetType, setTargetType] = useState('number');

  const [selectedOutlierCol, setSelectedOutlierCol] = useState(
    profile?.columns.find(c => c.outlierCount > 0)?.name || profile?.columns.find(c => c.type === 'number')?.name || ''
  );
  const [outlierAction, setOutlierAction] = useState('cap');

  const [selectedDropCol, setSelectedDropCol] = useState(profile?.columns[0]?.name || '');

  if (!activeDataset || !profile) return null;

  const handleApplyMissing = () => {
    if (!selectedMissingCol) return;
    applyCleaningAction('HANDLE_MISSING', {
      column: selectedMissingCol,
      strategy: missingStrategy,
      constantValue: constantVal,
    });
  };

  const handleRemoveDuplicates = () => {
    applyCleaningAction('REMOVE_DUPLICATES', {});
  };

  const handleApplyTypeConvert = () => {
    if (!selectedTypeCol) return;
    applyCleaningAction('CONVERT_TYPE', {
      column: selectedTypeCol,
      targetType,
    });
  };

  const handleApplyOutlier = () => {
    if (!selectedOutlierCol) return;
    applyCleaningAction('HANDLE_OUTLIERS', {
      column: selectedOutlierCol,
      action: outlierAction,
    });
  };

  const handleDropColumn = () => {
    if (!selectedDropCol) return;
    if (confirm(`Are you sure you want to drop column "${selectedDropCol}"?`)) {
      applyCleaningAction('DROP_COLUMN', { column: selectedDropCol });
    }
  };

  const missingColumns = profile.columns.filter(c => c.nullCount > 0);
  const outlierColumns = profile.columns.filter(c => c.outlierCount > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner: Scorecard and Undo/Reset Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Data Quality & Cleaning Studio</h2>
              <p className="text-xs text-slate-400">
                Fix missing values, purge duplicates, calibrate data types, and normalize IQR outliers safely.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={undoLastAction}
            disabled={!canUndo}
            icon={RotateCcw}
          >
            Undo Last ({cleaningHistory.length})
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={resetToRaw}
            disabled={cleaningHistory.length === 0}
            icon={RefreshCw}
          >
            Reset to Original
          </Button>
        </div>
      </div>

      {/* Cleaning Action Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Missing Value Imputation */}
        <Card
          title="Missing Values Imputation"
          subtitle={`${profile.totalMissingCells} missing cells across ${missingColumns.length} column(s)`}
          icon={AlertTriangle}
          className="border-amber-500/20"
        >
          <div className="space-y-4">
            {missingColumns.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero missing values! All columns in the current dataset are 100% complete.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Target Column:</label>
                  <select
                    value={selectedMissingCol}
                    onChange={(e) => setSelectedMissingCol(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    {profile.columns.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.nullCount} missing, {c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Imputation Strategy:</label>
                  <select
                    value={missingStrategy}
                    onChange={(e) => setMissingStrategy(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="mean">Mean Imputation (Numerical average)</option>
                    <option value="median">Median Imputation (Robust to skew)</option>
                    <option value="mode">Mode Imputation (Most frequent category)</option>
                    <option value="constant">Constant Replacement</option>
                    <option value="drop_row">Drop Rows with Missing Values</option>
                  </select>
                </div>

                {missingStrategy === 'constant' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Constant Value:</label>
                    <input
                      type="text"
                      placeholder="e.g. 0 or 'Unknown'"
                      value={constantVal}
                      onChange={(e) => setConstantVal(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyMissing}
                  className="w-full mt-2"
                >
                  Apply Missing Value Fix
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* 2. Duplicate Records Handling */}
        <Card
          title="Duplicate Row Removal"
          subtitle="Detect and purge completely identical rows across all attributes"
          icon={Copy}
          className="border-blue-500/20"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Identified Duplicates:</span>
                <span className="text-sm font-bold text-slate-100 font-mono">
                  {profile.duplicateRowsCount} ({profile.duplicateRowsPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${profile.duplicateRowsCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min(100, profile.duplicateRowsPercent * 5)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Completely duplicated rows can artificially distort distributions and introduce bias into summary aggregates and machine learning pipelines.
            </p>

            <Button
              variant={profile.duplicateRowsCount > 0 ? 'primary' : 'secondary'}
              size="sm"
              disabled={profile.duplicateRowsCount === 0}
              onClick={handleRemoveDuplicates}
              className="w-full"
            >
              Purge {profile.duplicateRowsCount} Duplicate Row(s)
            </Button>
          </div>
        </Card>

        {/* 3. Outlier Detection & Capping (IQR) */}
        <Card
          title="Statistical Outliers (IQR Method)"
          subtitle="Tukey 1.5x Interquartile Range boundary detection"
          icon={ShieldAlert}
          className="border-rose-500/20"
        >
          <div className="space-y-4">
            {outlierColumns.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>No statistical outliers detected beyond 1.5x IQR boundaries.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Target Numeric Feature:</label>
                  <select
                    value={selectedOutlierCol}
                    onChange={(e) => setSelectedOutlierCol(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    {profile.columns.filter(c => c.type === 'number').map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.outlierCount} outliers)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Outlier Action:</label>
                  <select
                    value={outlierAction}
                    onChange={(e) => setOutlierAction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="cap">Cap Outliers (Winsorize to [Q1 - 1.5IQR, Q3 + 1.5IQR])</option>
                    <option value="remove_row">Remove Outlier Rows from Dataset</option>
                  </select>
                </div>

                <p className="text-[11px] text-slate-500">
                  Winsorization preserves overall sample size by adjusting extreme values to the nearest valid fence without data loss.
                </p>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyOutlier}
                  className="w-full"
                >
                  Apply Outlier Treatment
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* 4. Type Casting & Column Dropping */}
        <Card
          title="Data Type Calibration & Column Management"
          subtitle="Re-cast column types or prune unnecessary attributes"
          icon={Sliders}
          className="border-purple-500/20"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Convert Data Type:</label>
              <div className="flex gap-2">
                <select
                  value={selectedTypeCol}
                  onChange={(e) => setSelectedTypeCol(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {profile.columns.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-28 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="string">String</option>
                  <option value="boolean">Boolean</option>
                </select>
                <Button variant="secondary" size="sm" onClick={handleApplyTypeConvert}>
                  Cast
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-400 block">Drop Column:</label>
              <div className="flex gap-2">
                <select
                  value={selectedDropCol}
                  onChange={(e) => setSelectedDropCol(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {profile.columns.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <Button variant="danger" size="sm" onClick={handleDropColumn} icon={Trash2}>
                  Drop
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Cleaning History & Transformation Audit Trail */}
      <Card
        title="Audit Trail of Applied Operations"
        subtitle={`Chronological log of all data modifications applied to "${activeDataset.fileName}"`}
        icon={History}
      >
        {cleaningHistory.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No transformations applied yet. The dataset is in its initial uploaded state.
          </p>
        ) : (
          <div className="space-y-2">
            {cleaningHistory.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-500">#{idx + 1}</span>
                  <Badge variant="primary" size="xs">
                    {item.type}
                  </Badge>
                  <span className="text-slate-200">{item.description}</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
