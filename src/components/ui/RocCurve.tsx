import React, { useState } from 'react';

interface RocCurveProps {
  rocCurve: { fpr: number; tpr: number }[];
  auc: number | null;
  status: string;
}

export const RocCurve: React.FC<RocCurveProps> = ({ rocCurve, auc, status }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ fpr: number; tpr: number } | null>(null);

  if (!rocCurve || rocCurve.length === 0 || auc === null) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700 mb-1">ROC Curve Not Available</p>
        <p className="text-slate-400">{status || 'Requires binary/multiclass probability predictions with varied test classes.'}</p>
      </div>
    );
  }

  const width = 360;
  const height = 260;
  const padding = 36;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  // Convert (fpr, tpr) to SVG coords: fpr goes 0 to 1 (left to right), tpr goes 0 to 1 (bottom to top)
  const toX = (fpr: number) => padding + fpr * plotWidth;
  const toY = (tpr: number) => height - padding - tpr * plotHeight;

  const pointsString = rocCurve.map((p) => `${toX(p.fpr)},${toY(p.tpr)}`).join(' ');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700">Receiver Operating Characteristic (ROC)</span>
        <span className="font-mono tabular-nums font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
          AUC = {auc.toFixed(3)}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-2 flex justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[420px] overflow-visible"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((val) => (
            <g key={val}>
              <line
                x1={toX(val)}
                y1={toY(0)}
                x2={toX(val)}
                y2={toY(1)}
                stroke="#E2E8F0"
                strokeDasharray="2,2"
              />
              <line
                x1={toX(0)}
                y1={toY(val)}
                x2={toX(1)}
                y2={toY(val)}
                stroke="#E2E8F0"
                strokeDasharray="2,2"
              />
              {/* Axis labels */}
              <text
                x={toX(val)}
                y={height - padding + 14}
                fontSize="10"
                fill="#64748B"
                textAnchor="middle"
                className="font-mono tabular-nums"
              >
                {val}
              </text>
              <text
                x={padding - 8}
                y={toY(val) + 3}
                fontSize="10"
                fill="#64748B"
                textAnchor="end"
                className="font-mono tabular-nums"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Random Guess Diagonal */}
          <line
            x1={toX(0)}
            y1={toY(0)}
            x2={toX(1)}
            y2={toY(1)}
            stroke="#94A3B8"
            strokeDasharray="4,4"
            strokeWidth="1.5"
          />

          {/* Area Under Curve Fill */}
          <polygon
            points={`${toX(0)},${toY(0)} ${pointsString} ${toX(1)},${toY(0)}`}
            fill="rgba(79, 70, 229, 0.08)"
          />

          {/* ROC Line */}
          <polyline
            points={pointsString}
            fill="none"
            stroke="#4F46E5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {rocCurve.map((pt, i) => (
            <circle
              key={i}
              cx={toX(pt.fpr)}
              cy={toY(pt.tpr)}
              r={hoveredPoint && hoveredPoint.fpr === pt.fpr ? 5 : 2.5}
              fill="#4F46E5"
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* Axis Titles */}
          <text
            x={width / 2}
            y={height - 4}
            fontSize="10"
            fontWeight="600"
            fill="#475569"
            textAnchor="middle"
          >
            False Positive Rate (1 - Specificity)
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
            True Positive Rate (Sensitivity)
          </text>
        </svg>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between">
        <span>Dashed line: random classifier baseline (AUC = 0.50)</span>
        {hoveredPoint && (
          <span className="font-mono tabular-nums text-slate-700">
            FPR: {hoveredPoint.fpr.toFixed(3)}, TPR: {hoveredPoint.tpr.toFixed(3)}
          </span>
        )}
      </div>
    </div>
  );
};
