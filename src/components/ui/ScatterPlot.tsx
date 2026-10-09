import React, { useState } from 'react';

interface ScatterPlotProps {
  data: { actual: number; predicted: number }[];
  title?: string;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  title = 'Actual vs Predicted Regression Parity',
}) => {
  const [hovered, setHovered] = useState<{ actual: number; predicted: number } | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-400 p-4">No regression scatter data available.</div>;
  }

  const width = 380;
  const height = 260;
  const padding = 38;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const actuals = data.map((d) => d.actual);
  const predicteds = data.map((d) => d.predicted);

  const minVal = Math.min(...actuals, ...predicteds);
  const maxVal = Math.max(...actuals, ...predicteds);
  const range = maxVal - minVal || 1;

  const toX = (val: number) => padding + ((val - minVal) / range) * plotWidth;
  const toY = (val: number) => height - padding - ((val - minVal) / range) * plotHeight;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700">{title}</span>
        <span className="text-[11px] text-slate-400">Sample size: {data.length} test points</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-2 flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[420px] overflow-visible">
          {/* Parity 45-deg line (Actual = Predicted) */}
          <line
            x1={toX(minVal)}
            y1={toY(minVal)}
            x2={toX(maxVal)}
            y2={toY(maxVal)}
            stroke="#94A3B8"
            strokeDasharray="4,4"
            strokeWidth="1.5"
          />

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
            const v = minVal + frac * range;
            return (
              <g key={frac}>
                <line
                  x1={toX(v)}
                  y1={toY(minVal)}
                  x2={toX(v)}
                  y2={toY(maxVal)}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <line
                  x1={toX(minVal)}
                  y1={toY(v)}
                  x2={toX(maxVal)}
                  y2={toY(v)}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={toX(v)}
                  y={height - padding + 14}
                  fontSize="9"
                  fill="#64748B"
                  textAnchor="middle"
                  className="font-mono tabular-nums"
                >
                  {v.toFixed(1)}
                </text>
                <text
                  x={padding - 6}
                  y={toY(v) + 3}
                  fontSize="9"
                  fill="#64748B"
                  textAnchor="end"
                  className="font-mono tabular-nums"
                >
                  {v.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Scatter points */}
          {data.map((d, i) => {
            const err = Math.abs(d.actual - d.predicted);
            const isClose = err <= range * 0.1;
            return (
              <circle
                key={i}
                cx={toX(d.actual)}
                cy={toY(d.predicted)}
                r={hovered && hovered.actual === d.actual ? 5 : 3}
                fill={isClose ? '#4F46E5' : '#EC4899'}
                fillOpacity={0.7}
                className="cursor-pointer transition-all hover:opacity-100"
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 4}
            fontSize="10"
            fontWeight="600"
            fill="#475569"
            textAnchor="middle"
          >
            Actual Target Value
          </text>
          <text
            x={-(height / 2)}
            y={12}
            fontSize="10"
            fontWeight="600"
            fill="#475569"
            textAnchor="middle"
            transform="rotate(-90)"
          >
            Predicted Target Value
          </text>
        </svg>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between">
        <span>Dashed line: perfect prediction identity line (y = y&#770;)</span>
        {hovered && (
          <span className="font-mono tabular-nums text-slate-700">
            Actual: {hovered.actual.toFixed(2)}, Pred: {hovered.predicted.toFixed(2)} (Err: {(hovered.actual - hovered.predicted).toFixed(2)})
          </span>
        )}
      </div>
    </div>
  );
};
