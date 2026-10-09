import React from 'react';

interface BarItem {
  label: string;
  value: number;
  subtext?: string;
}

interface BarChartProps {
  data: BarItem[];
  title?: string;
  maxValue?: number;
  color?: string;
  unit?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  maxValue,
  color = 'bg-indigo-600',
  unit = '',
}) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-400 p-4">No distribution data available.</div>;
  }

  const computedMax = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {title && <div className="text-xs font-medium text-slate-700">{title}</div>}
      <div className="space-y-2">
        {data.map((item, idx) => {
          const pct = Math.min(100, Math.max(2, (item.value / computedMax) * 100));
          return (
            <div key={idx} className="group">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-700 font-medium truncate max-w-[200px]" title={item.label}>
                  {item.label}
                </span>
                <span className="font-mono tabular-nums text-slate-600 font-medium">
                  {item.value} {unit}
                  {item.subtext && <span className="text-slate-400 ml-1 font-normal">({item.subtext})</span>}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
