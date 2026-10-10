import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card } from '../common/Card';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-slate-200 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-brand-300 font-mono">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function BarChartCard({ title, subtitle, data, xKey = 'group', yKey = 'value', height = 300, color = '#0e8ce9' }) {
  if (!data || data.length === 0) {
    return (
      <Card title={title} subtitle={subtitle}>
        <div className="h-64 flex items-center justify-center text-xs text-slate-500">
          No data available for visualization.
        </div>
      </Card>
    );
  }

  return (
    <Card title={title} subtitle={subtitle}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 35 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey={xKey}
              stroke="#94a3b8"
              fontSize={11}
              interval={0}
              angle={-25}
              textAnchor="end"
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
