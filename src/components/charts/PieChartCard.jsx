import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { Card } from '../common/Card';

const COLORS = ['#0e8ce9', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#64748b'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-slate-200 mb-1">{data.name}</p>
        <p className="text-brand-300 font-mono">
          Value: {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
        </p>
      </div>
    );
  }
  return null;
};

export function PieChartCard({ title, subtitle, data, height = 300, isDonut = true }) {
  if (!data || data.length === 0) {
    return (
      <Card title={title} subtitle={subtitle}>
        <div className="h-64 flex items-center justify-center text-xs text-slate-500">
          No categorical proportions available.
        </div>
      </Card>
    );
  }

  return (
    <Card title={title} subtitle={subtitle}>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              innerRadius={isDonut ? 55 : 0}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
