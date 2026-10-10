import React from 'react';

export function Card({
  children,
  title,
  subtitle,
  badge,
  action,
  icon: Icon,
  className = '',
  headerClassName = '',
  bodyClassName = '',
}) {
  return (
    <div className={`glass-card rounded-xl overflow-hidden border border-slate-800 shadow-md ${className}`}>
      {(title || subtitle || action || Icon) && (
        <div className={`px-5 py-4 border-b border-slate-800/80 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {title && <h3 className="font-semibold text-slate-100 truncate text-base">{title}</h3>}
                {badge}
              </div>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
