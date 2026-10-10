import React from 'react';

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'brand',
  trend = null,
  className = '',
}) {
  const iconColors = {
    brand: 'bg-orange-50 text-coral-500 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${iconColors[variant] || iconColors.brand}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.text}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1 text-xs text-slate-400 font-medium">{subtext}</p>}
    </div>
  );
}
