import React, { useState } from 'react';

interface ResidualPlotProps {
  residualPoints: { predicted: number; residual: number }[];
  residualDistribution: { bin: string; count: number }[];
}

export const ResidualPlot: React.FC<ResidualPlotProps> = ({
  residualPoints,
  residualDistribution,
}) => {
  const [activeTab, setActiveTab] = useState<'scatter' | 'histogram'>('scatter');
  const [hoveredPoint, setHoveredPoint] = useState<{ predicted: number; residual: number } | null>(null);

  if (!residualPoints || residualPoints.length === 0) {
    return <div className="text-xs text-slate-400 p-4">No residual data available.</div>;
  }

  const width = 380;
  const height = 260;
  const padding = 38;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const preds = residualPoints.map((p) => p.predicted);
  const resids = residualPoints.map((p) => p.residual);

  const minPred = Math.min(...preds);
  const maxPred = Math.max(...preds);
  const predRange = maxPred - minPred || 1;

  const maxAbsResid = Math.max(...resids.map(Math.abs), 1);
  const minResid = -maxAbsResid;
  const maxResid = maxAbsResid;
  const residRange = maxResid - minResid || 1;

  const toX = (val: number) => padding + ((val - minPred) / predRange) * plotWidth;
  const toY = (val: number) => height - padding - ((val - minResid) / residRange) * plotHeight;

  // Max count for histogram
  const maxHistCount = Math.max(...residualDistribution.map((d) => d.count), 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium text-slate-700">Model Error & Residual Analysis</span>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={() => setActiveTab('scatter')}
            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
              activeTab === 'scatter' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Residual Scatter
          </button>
          <button
            onClick={() => setActiveTab('histogram')}
            className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
              activeTab === 'histogram' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Distribution
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-2 flex justify-center">
        {activeTab === 'scatter' ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[420px] overflow-visible">
            {/* Zero residual horizontal line */}
            <line
              x1={padding}
              y1={toY(0)}
              x2={width - padding}
              y2={toY(0)}
              stroke="#EF4444"
              strokeDasharray="3,3"
              strokeWidth="1.5"
            />

            {/* Grid lines */}
            {[minResid, minResid / 2, 0, maxResid / 2, maxResid].map((val) => (
              <g key={val}>
                <line
                  x1={padding}
                  y1={toY(val)}
                  x2={width - padding}
                  y2={toY(val)}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={padding - 6}
                  y={toY(val) + 3}
                  fontSize="9"
                  fill="#64748B"
                  textAnchor="end"
                  className="font-mono tabular-nums"
                >
                  {val.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Scatter dots */}
            {residualPoints.map((pt, i) => (
              <circle
                key={i}
                cx={toX(pt.predicted)}
                cy={toY(pt.residual)}
                r={hoveredPoint && hoveredPoint.predicted === pt.predicted ? 5 : 3}
                fill="#6366F1"
                fillOpacity={0.7}
                className="cursor-pointer transition-all hover:opacity-100"
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
              Predicted Value (y&#770;)
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
              Residual Error (y - y&#770;)
            </text>
          </svg>
        ) : (
          /* Histogram view */
          <div className="w-full p-2 flex flex-col justify-end h-[240px]">
            <div className="flex items-end gap-1.5 h-44 border-b border-slate-200 pb-1">
              {residualDistribution.map((item, i) => {
                const heightPct = (item.count / maxHistCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full bg-indigo-500/80 rounded-t group-hover:bg-indigo-600 transition-all"
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                    <div className="hidden group-hover:block absolute -top-7 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap z-10 font-mono tabular-nums">
                      {item.bin}: {item.count} samples
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono tabular-nums">
              <span>{residualDistribution[0]?.bin.split(' to ')[0] || ''}</span>
              <span className="text-slate-600 font-semibold">Zero-Centered Normal Error</span>
              <span>{residualDistribution[residualDistribution.length - 1]?.bin.split(' to ')[1] || ''}</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between">
        <span>Red dashed line: zero error threshold (y = y&#770;)</span>
        {hoveredPoint && (
          <span className="font-mono tabular-nums text-slate-700">
            Pred: {hoveredPoint.predicted.toFixed(2)}, Residual: {hoveredPoint.residual.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
};
