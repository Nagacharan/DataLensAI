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
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Or explore curated sample datasets
        </h3>
        <span className="text-xs text-slate-400">Ready to analyze in 1-click</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAMPLE_DATASETS.map((sample) => {
          const Icon = getIcon(sample.id);
          return (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.getNormalized())}
              className="bg-slate-50/80 border border-slate-200/90 hover:border-orange-300 hover:bg-orange-50/40 rounded-2xl p-4 cursor-pointer transition-all group flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="p-2 rounded-xl bg-orange-100 text-coral-600 border border-orange-200 group-hover:bg-coral-500 group-hover:text-white transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <Badge variant="primary" size="xs">
                    {sample.badge}
                  </Badge>
                </div>

                <h4 className="font-semibold text-slate-900 group-hover:text-coral-600 transition text-xs sm:text-sm">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{sample.rowsCount} records</span>
                <span className="inline-flex items-center gap-1 text-coral-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Load <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
