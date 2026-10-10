import React from 'react';
import { SAMPLE_DATASETS } from '../../utils/sample-datasets';
import { Badge } from '../common/Badge';
import { ShoppingCart, GraduationCap, Receipt, ArrowRight } from 'lucide-react';

export function SampleDatasetPicker({ onSelectSample }) {
  const getIcon = (id) => {
    switch (id) {
      case 'sales':
        return ShoppingCart;
      case 'student':
        return GraduationCap;
      case 'expenses':
        return Receipt;
      default:
        return Receipt;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Or explore curated sample datasets
        </h3>
        <span className="text-xs text-slate-500">Ready to analyze in 1-click</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAMPLE_DATASETS.map((sample) => {
          const Icon = getIcon(sample.id);
          return (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.getNormalized())}
              className="glass-card rounded-xl p-5 border border-slate-800/80 hover:border-brand-500/50 hover:bg-slate-800/40 cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 group-hover:bg-brand-500/20 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="primary" size="xs">
                    {sample.badge}
                  </Badge>
                </div>

                <h4 className="font-semibold text-slate-100 group-hover:text-brand-300 transition text-sm">
                  {sample.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{sample.rowsCount} records</span>
                <span className="inline-flex items-center gap-1 text-brand-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  Load <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
