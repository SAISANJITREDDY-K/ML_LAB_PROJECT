import React, { useState } from 'react';

interface ConfusionMatrixProps {
  matrix: number[][];
  classes: string[];
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ matrix, classes }) => {
  const [hoveredCell, setHoveredCell] = useState<{ actual: string; predicted: string; count: number; pct: number } | null>(null);

  if (!matrix || matrix.length === 0 || !classes || classes.length === 0) {
    return <div className="text-xs text-slate-400 p-4">No confusion matrix data available.</div>;
  }

  // Calculate total samples
  let totalSamples = 0;
  let maxCell = 0;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < (matrix[r]?.length || 0); c++) {
      totalSamples += matrix[r][c];
      if (matrix[r][c] > maxCell) maxCell = matrix[r][c];
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700">Held-Out Test Set Confusion Heatmap</span>
        <span className="font-mono tabular-nums">Total evaluated samples: {totalSamples}</span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Top Label: Predicted */}
          <div className="text-center text-xs font-semibold text-slate-600 mb-1">
            Predicted Class →
          </div>

          <div className="flex items-center">
            {/* Left Label: Actual */}
            <div className="text-xs font-semibold text-slate-600 -rotate-90 origin-center whitespace-nowrap w-6 text-center select-none">
              Actual Class
            </div>

            {/* Matrix grid */}
            <div className="flex-1 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              {/* Header column labels */}
              <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: `100px repeat(${classes.length}, minmax(64px, 1fr))` }}>
                <div className="text-[11px] font-semibold text-slate-400 truncate text-right pr-2">Actual \ Pred</div>
                {classes.map((cls, idx) => (
                  <div key={idx} className="text-[11px] font-semibold text-slate-700 text-center truncate px-1" title={cls}>
                    {cls}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {classes.map((actualCls, rowIdx) => (
                <div
                  key={rowIdx}
                  className="grid gap-1.5 mb-1.5 items-center"
                  style={{ gridTemplateColumns: `100px repeat(${classes.length}, minmax(64px, 1fr))` }}
                >
                  <div className="text-xs font-semibold text-slate-700 truncate text-right pr-2" title={actualCls}>
                    {actualCls}
                  </div>
                  {classes.map((predCls, colIdx) => {
                    const count = matrix[rowIdx]?.[colIdx] ?? 0;
                    const isDiagonal = rowIdx === colIdx;
                    const intensity = maxCell > 0 ? count / maxCell : 0;
                    const pct = totalSamples > 0 ? (count / totalSamples) * 100 : 0;

                    const bgColor = isDiagonal
                      ? `rgba(79, 70, 229, ${Math.max(0.12, intensity * 0.9)})`
                      : count > 0
                      ? `rgba(244, 63, 94, ${Math.max(0.1, intensity * 0.7)})`
                      : 'rgba(241, 245, 249, 0.6)';

                    const textColor = intensity > 0.5 ? (isDiagonal ? 'text-white' : 'text-slate-900') : 'text-slate-800';

                    return (
                      <div
                        key={colIdx}
                        onMouseEnter={() => setHoveredCell({ actual: actualCls, predicted: predCls, count, pct })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-14 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer border ${
                          isDiagonal ? 'border-indigo-300/40' : 'border-slate-200/60'
                        } hover:scale-105 hover:shadow-xs`}
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className={`text-sm font-bold font-mono tabular-nums ${textColor}`}>
                          {count}
                        </span>
                        <span className={`text-[10px] font-mono tabular-nums ${intensity > 0.5 && isDiagonal ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {hoveredCell ? (
        <div className="text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-md flex items-center gap-2">
          <span className="font-medium text-slate-900">Cell Details:</span>
          <span>Actual: <strong className="text-slate-800">{hoveredCell.actual}</strong></span>
          <span>·</span>
          <span>Predicted: <strong className="text-slate-800">{hoveredCell.predicted}</strong></span>
          <span>·</span>
          <span>Count: <strong className="font-mono tabular-nums">{hoveredCell.count}</strong> ({hoveredCell.pct.toFixed(1)}%)</span>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400">
          Diagonal cells (indigo) represent correct predictions; off-diagonal cells represent misclassifications.
        </div>
      )}
    </div>
  );
};
