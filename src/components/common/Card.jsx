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
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}>
      {(title || subtitle || action || Icon) && (
        <div className={`px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-1.5 rounded-lg bg-orange-50 text-coral-500 border border-orange-100 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {title && <h3 className="font-bold text-slate-800 truncate text-sm sm:text-base tracking-tight">{title}</h3>}
                {badge}
              </div>
              {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
