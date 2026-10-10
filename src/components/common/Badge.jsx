import React from 'react';

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }) {
  const variants = {
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200/80',
    primary: 'bg-orange-50 text-coral-600 border border-orange-200/80',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-600 border border-rose-200/80',
    accent: 'bg-purple-50 text-purple-600 border border-purple-200/80',
    number: 'bg-blue-50 text-blue-600 border border-blue-200/80',
    string: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80',
    date: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    boolean: 'bg-rose-50 text-rose-600 border border-rose-200/80',
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${variants[variant] || variants.neutral} ${sizes[size] || sizes.sm} ${className}`}
    >
      {children}
    </span>
  );
}

export function ColumnTypeBadge({ type }) {
  return (
    <Badge variant={type || 'neutral'} size="xs" className="uppercase font-mono tracking-wider">
      {type}
    </Badge>
  );
}
