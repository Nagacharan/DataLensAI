import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card } from '../common/Card';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const pt = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs">
        <p className="text-brand-300 font-mono">X: {pt.x?.toLocaleString()}</p>
        <p className="text-purple-300 font-mono">Y: {pt.y?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export function ScatterChartCard({ title, subtitle, data, xLabel, yLabel, height = 300, color = '#38a8f8' }) {
  if (!data || data.length === 0) {
    return (
      <Card title={title} subtitle={subtitle}>
        <div className="h-64 flex items-center justify-center text-xs text-slate-500">
          No paired numeric data available for scatter plot.
        </div>
      </Card>
    );
  }

  return (
    <Card title={title} subtitle={subtitle}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Observations" data={data} fill={color} fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
