import React, { useState } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Card } from '../common/Card';
import { ColumnTypeBadge, Badge } from '../common/Badge';
import { Table, Key, AlertCircle, Search } from 'lucide-react';

export function SchemaTable() {
  const { profile } = useDataset();
  const [searchTerm, setSearchTerm] = useState('');

  if (!profile || !profile.columns) return null;

  const filteredColumns = profile.columns.filter(col =>
    col.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card
      title="Schema & Column Diagnostics"
      subtitle="Inferred types, missing rates, uniqueness, and statistical outlier counts"
      icon={Table}
      action={
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Column Name</th>
              <th className="py-3 px-4">Inferred Type</th>
              <th className="py-3 px-4">Role / Tag</th>
              <th className="py-3 px-4">Missing Values</th>
              <th className="py-3 px-4">Unique Values</th>
              <th className="py-3 px-4">Outliers (IQR)</th>
              <th className="py-3 px-4">Sample Values Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredColumns.map((col) => (
              <tr key={col.name} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-slate-100 flex items-center gap-2">
                  {col.name}
                  {col.isIdentifier && (
                    <span title="Detected as unique primary identifier">
                      <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <ColumnTypeBadge type={col.type} />
                </td>
                <td className="py-3 px-4">
                  {col.isIdentifier ? (
                    <Badge variant="warning" size="xs">Identifier</Badge>
                  ) : col.type === 'number' ? (
                    <Badge variant="neutral" size="xs">Metric</Badge>
                  ) : col.type === 'date' ? (
                    <Badge variant="date" size="xs">Temporal</Badge>
                  ) : (
                    <Badge variant="neutral" size="xs">Dimension</Badge>
                  )}
                </td>
                <td className="py-3 px-4">
                  {col.nullCount > 0 ? (
                    <span className="text-amber-400 font-medium">
                      {col.nullCount} ({col.nullPercentage}%)
                    </span>
                  ) : (
                    <span className="text-emerald-400">0 (0%)</span>
                  )}
                </td>
                <td className="py-3 px-4 font-mono">
                  {col.uniqueCount.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  {col.outlierCount > 0 ? (
                    <span className="text-rose-400 font-medium inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {col.outlierCount} ({col.outlierPercentage}%)
                    </span>
                  ) : col.type === 'number' ? (
                    <span className="text-slate-500">None</span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="py-3 px-4 max-w-xs truncate text-slate-400 font-mono text-[11px]">
                  {col.sampleValues && col.sampleValues.length > 0
                    ? col.sampleValues.map(v => String(v)).join(', ')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
