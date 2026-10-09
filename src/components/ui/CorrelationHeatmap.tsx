import React, { useState } from 'react';

interface CorrelationHeatmapProps {
  columns: string[];
  matrix: number[][];
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ columns, matrix }) => {
  const [hoveredCell, setHoveredCell] = useState<{ col1: string; col2: string; val: number } | null>(null);

  if (!columns || columns.length === 0 || !matrix || matrix.length === 0) {
    return (
      <div className="text-xs text-slate-400 p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
        Fewer than 2 non-constant numerical columns found for correlation analysis.
      </div>
    );
  }

  // Color mapper from -1.0 (blue/cyan) to 0.0 (white/gray) to +1.0 (deep indigo)
  const getColor = (val: number) => {
    if (val >= 0) {
      return `rgba(79, 70, 229, ${Math.max(0.08, val * 0.85)})`;
    } else {
      return `rgba(14, 165, 233, ${Math.max(0.08, Math.abs(val) * 0.85)})`;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700">Pairwise Pearson Correlation Matrix</span>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block" /> Negative (-1.0)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-indigo-600 inline-block" /> Positive (+1.0)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto bg-slate-50/50 p-3 rounded-xl border border-slate-200">
        <div className="inline-block min-w-full">
          {/* Header Row */}
          <div
            className="grid gap-1 mb-1"
            style={{ gridTemplateColumns: `110px repeat(${columns.length}, minmax(48px, 1fr))` }}
          >
            <div className="text-[11px] font-semibold text-slate-400 truncate text-right pr-2">Feature</div>
            {columns.map((c, i) => (
              <div
                key={i}
                className="text-[10px] font-semibold text-slate-600 text-center truncate px-0.5"
                title={c}
              >
                {c.length > 8 ? `${c.slice(0, 7)}…` : c}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {columns.map((rowName, rIdx) => (
            <div
              key={rIdx}
              className="grid gap-1 mb-1 items-center"
              style={{ gridTemplateColumns: `110px repeat(${columns.length}, minmax(48px, 1fr))` }}
            >
              <div className="text-[11px] font-medium text-slate-700 truncate text-right pr-2" title={rowName}>
                {rowName}
              </div>
              {columns.map((colName, cIdx) => {
                const val = matrix[rIdx]?.[cIdx] ?? 0;
                const isDiag = rIdx === cIdx;
                const isStrong = Math.abs(val) > 0.6;

                return (
                  <div
                    key={cIdx}
                    onMouseEnter={() => setHoveredCell({ col1: rowName, col2: colName, val })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`h-10 rounded flex items-center justify-center cursor-pointer transition-all border ${
                      isDiag ? 'border-indigo-300' : 'border-slate-200/50'
                    } hover:scale-110 hover:shadow-xs`}
                    style={{ backgroundColor: getColor(val) }}
                  >
                    <span
                      className={`text-[10px] font-mono tabular-nums font-medium ${
                        isStrong ? (val > 0 ? 'text-white' : 'text-slate-900') : 'text-slate-800'
                      }`}
                    >
                      {val.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {hoveredCell ? (
        <div className="text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md flex items-center gap-2">
          <span>{hoveredCell.col1}</span>
          <span className="text-slate-400">↔</span>
          <span>{hoveredCell.col2}:</span>
          <strong className="font-mono tabular-nums text-indigo-700">{hoveredCell.val.toFixed(3)}</strong>
          <span className="text-slate-500 text-[11px]">
            ({hoveredCell.val > 0.7 ? 'Strong positive' : hoveredCell.val < -0.7 ? 'Strong negative' : Math.abs(hoveredCell.val) < 0.2 ? 'Negligible' : 'Moderate'} correlation)
          </span>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400">
          Values near ±1 indicate collinearity. Highly correlated input features may cause multicollinearity.
        </div>
      )}
    </div>
  );
};
