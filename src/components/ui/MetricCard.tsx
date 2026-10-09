import React from 'react';
import { Info } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  tooltip?: string;
  badge?: string;
  badgeType?: 'success' | 'warning' | 'info';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  tooltip,
  badge,
  badgeType = 'info',
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs relative group transition-all hover:border-slate-300">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
        <div className="flex items-center gap-1.5 font-medium">
          <span>{label}</span>
          {tooltip && (
            <div className="relative cursor-help" title={tooltip}>
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            </div>
          )}
        </div>
        {badge && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              badgeType === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : badgeType === 'warning'
                ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
        {value}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-500 font-normal">
          {subtext}
        </p>
      )}
    </div>
  );
};
