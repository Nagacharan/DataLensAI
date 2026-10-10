import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card } from '../common/Card';
import { computeHistogramBins } from '../../utils/analysis/distributions.js';

export { computeHistogramBins };

export function HistogramChartCard({ title, subtitle, values, height = 300, color = '#10b981' }) {
  const binData = computeHistogramBins(values || []);

  if (binData.length === 0) {
    return (
      <Card title={title} subtitle={subtitle}>
        <div className="h-64 flex items-center justify-center text-xs text-slate-500">
          No numeric distribution available.
        </div>
      </Card>
    );
  }

  return (
    <Card title={title} subtitle={subtitle}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={binData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="bin" stroke="#94a3b8" fontSize={10} interval={0} angle={-20} textAnchor="end" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" fontSize={11} tick={{ fill: '#94a3b8' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs">
                      <p className="font-semibold text-slate-200">Bin: {payload[0].payload.bin}</p>
                      <p className="text-emerald-400 font-mono">Frequency: {payload[0].value} observations</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
