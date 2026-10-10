import React from 'react';

export function Badge({ children, variant = 'neutral', size = 'sm', className = '' }) {
  const variants = {
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700/60',
    primary: 'bg-brand-500/15 text-brand-400 border border-brand-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30',
    accent: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    number: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    string: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    date: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    boolean: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
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
