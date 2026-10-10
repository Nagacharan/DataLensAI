import React, { useState } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { Card } from '../common/Card';
import { ColumnTypeBadge, Badge } from '../common/Badge';
import { Table, Key, AlertCircle, Search, HelpCircle, CheckCircle } from 'lucide-react';

export function SchemaTable() {
  const { semanticUnderstanding } = useDataset();
  const [searchTerm, setSearchTerm] = useState('');

  if (!semanticUnderstanding || !semanticUnderstanding.columns) return null;

  const filteredColumns = semanticUnderstanding.columns.filter(col =>
    col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (col.semanticLabel && col.semanticLabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card
      title="Dataset Structure: Observed Facts vs Inferred Meanings"
      subtitle="Deterministic mathematical observations contrasted with inferred real-world semantic roles"
      icon={Table}
      action={
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search columns or roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-900/40">
              <th className="py-3 px-4">Column Name</th>
              <th className="py-3 px-4">Inferred Role</th>
              <th className="py-3 px-4">Data Type</th>
              <th className="py-3 px-4 min-w-[200px]">Observed Mathematical Facts</th>
              <th className="py-3 px-4 min-w-[220px]">Inferred Semantic Meaning</th>
              <th className="py-3 px-4">Hygiene Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredColumns.map((col) => (
              <tr key={col.name} className="hover:bg-slate-800/30 transition-colors">
                {/* Column Name */}
                <td className="py-3 px-4 font-mono font-medium text-slate-100 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {col.name}
                    {col.isIdentifier && (
                      <span title="Detected as record identifier">
                        <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </span>
                    )}
                  </div>
                </td>

                {/* Inferred Role Badge */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <Badge
                    variant={
                      col.semanticRole === 'identifier'
                        ? 'warning'
                        : col.semanticRole === 'monetary_metric'
                        ? 'primary'
                        : col.semanticRole === 'temporal'
                        ? 'date'
                        : col.semanticRole === 'categorical_dimension' || col.semanticRole === 'geographic_dimension'
                        ? 'success'
                        : 'neutral'
                    }
                    size="xs"
                  >
                    {col.semanticLabel || col.semanticRole}
                  </Badge>
                </td>

                {/* Data Type */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <ColumnTypeBadge type={col.type} />
                </td>

                {/* Observed Facts */}
                <td className="py-3 px-4 text-slate-300 text-[11px] leading-relaxed">
                  {col.observedFacts}
                </td>

                {/* Inferred Semantic Meaning */}
                <td className="py-3 px-4 text-slate-400 text-[11px] leading-relaxed">
                  {col.inferredMeaning}
                </td>

                {/* Hygiene Status */}
                <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                  {col.nullCount > 0 ? (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {col.nullCount} missing ({col.nullPercentage}%)
                    </span>
                  ) : col.outlierCount > 0 ? (
                    <span className="text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {col.outlierCount} outliers
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 shrink-0" />
                      Clean
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
