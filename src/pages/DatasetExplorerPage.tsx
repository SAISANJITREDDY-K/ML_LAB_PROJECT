import React, { useState, useEffect } from 'react';
import {
  Database,
  BarChart2,
  Trash2,
  Sparkles,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Layers,
  Table,
} from 'lucide-react';
import {
  DatasetMeta,
  DatasetSummary,
  DatasetPreview,
  VisualizationsData,
} from '../types';
import {
  fetchDatasetSummary,
  fetchDatasetPreview,
  fetchDatasetVisualizations,
  cleanDatasetDuplicates,
} from '../services/api';
import { DataTable } from '../components/ui/DataTable';
import { BarChart } from '../components/ui/BarChart';
import { CorrelationHeatmap } from '../components/ui/CorrelationHeatmap';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface DatasetExplorerPageProps {
  datasets: DatasetMeta[];
  selectedDatasetId: string | null;
  onSelectDatasetId: (id: string) => void;
  onOpenUpload: () => void;
  onNavigateToTraining: (datasetId: string) => void;
}

export const DatasetExplorerPage: React.FC<DatasetExplorerPageProps> = ({
  datasets,
  selectedDatasetId,
  onSelectDatasetId,
  onOpenUpload,
  onNavigateToTraining,
}) => {
  const activeDatasetId = selectedDatasetId || (datasets.length > 0 ? datasets[0].id : null);

  const [activeTab, setActiveTab] = useState<'preview' | 'missing' | 'stats' | 'visualizations'>('preview');
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [visualizations, setVisualizations] = useState<VisualizationsData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanFeedback, setCleanFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load dataset data whenever active dataset changes
  useEffect(() => {
    if (!activeDatasetId) return;
    loadAllDatasetData(activeDatasetId, 1);
  }, [activeDatasetId]);

  const loadAllDatasetData = async (datasetId: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    setCleanFeedback(null);
    try {
      const [sumData, prevData, visData] = await Promise.all([
        fetchDatasetSummary(datasetId),
        fetchDatasetPreview(datasetId, pageNum, 20),
        fetchDatasetVisualizations(datasetId),
      ]);
      setSummary(sumData);
      setPreview(prevData);
      setVisualizations(visData);
      setPage(pageNum);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load dataset details');
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!activeDatasetId) return;
    setLoading(true);
    try {
      const prevData = await fetchDatasetPreview(activeDatasetId, newPage, 20);
      setPreview(prevData);
      setPage(newPage);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to change page');
      setLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!activeDatasetId) return;
    setCleaning(true);
    setCleanFeedback(null);
    try {
      const res = await cleanDatasetDuplicates(activeDatasetId);
      setCleanFeedback(`Successfully removed ${res.removed_rows} duplicate rows. Remaining rows: ${res.remaining_rows}.`);
      await loadAllDatasetData(activeDatasetId, 1);
      setCleaning(false);
    } catch (err: any) {
      setError(err.message || 'Failed to remove duplicates');
      setCleaning(false);
    }
  };

  const handleDownloadSummaryJSON = () => {
    if (!summary) return;
    const jsonStr = JSON.stringify(summary, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${summary.filename.replace('.csv', '')}_summary.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (datasets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <Database className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 mb-1">No Datasets Available</h3>
        <p className="text-xs text-slate-500 mb-6">
          Upload a CSV dataset to explore its statistical distributions and prepare it for model training.
        </p>
        <button
          onClick={onOpenUpload}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
        >
          Upload CSV Dataset
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls: Dataset Selector & Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="dataset-select" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Selected Dataset:
          </label>
          <select
            id="dataset-select"
            value={activeDatasetId || ''}
            onChange={(e) => onSelectDatasetId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            {datasets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name} ({ds.rows} rows, {ds.columns} cols)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {summary && (
            <button
              onClick={handleDownloadSummaryJSON}
              title="Download detailed statistical summary as JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Summary</span>
            </button>
          )}

          {activeDatasetId && (
            <button
              onClick={() => onNavigateToTraining(activeDatasetId)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <span>Configure & Train →</span>
            </button>
          )}
        </div>
      </div>

      {cleanFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cleanFeedback}</span>
          </div>
          <button
            onClick={() => setCleanFeedback(null)}
            className="text-xs text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset Summary Cards Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Total Rows</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {summary.rows}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Total Columns</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {summary.columns}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Numeric Features</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {summary.numerical_column_count}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Categorical Features</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {summary.categorical_column_count}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Duplicate Rows</span>
            <div className="flex items-center justify-between">
              <span className={`text-xl font-bold font-mono tabular-nums ${summary.duplicate_rows > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {summary.duplicate_rows}
              </span>
              {summary.duplicate_rows > 0 && (
                <button
                  onClick={handleRemoveDuplicates}
                  disabled={cleaning}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold underline"
                >
                  {cleaning ? 'Cleaning...' : 'Deduplicate'}
                </button>
              )}
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block mb-0.5">Suggested Task</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase font-mono">
              {summary.suggested_task}
            </span>
          </div>
        </div>
      )}

      {/* Explorer Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-px">
        {[
          { id: 'preview', label: 'Data Preview' },
          { id: 'missing', label: 'Missing & Quality' },
          { id: 'stats', label: 'Descriptive Statistics' },
          { id: 'visualizations', label: 'Distributions & Correlations' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && !preview ? (
        <LoadingSpinner label="Loading dataset records and statistics..." />
      ) : (
        <>
          {/* TAB 1: DATA PREVIEW */}
          {activeTab === 'preview' && preview && (
            <DataTable
              columns={preview.columns}
              records={preview.records}
              totalRecords={preview.total_records}
              currentPage={page}
              totalPages={preview.total_pages}
              onPageChange={handlePageChange}
              isLoading={loading}
            />
          )}

          {/* TAB 2: MISSING VALUES & DATA QUALITY */}
          {activeTab === 'missing' && summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Missing Bar Chart */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Missing Value Frequency by Column
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      Total columns: {summary.columns}
                    </span>
                  </div>

                  <BarChart
                    data={Object.entries(summary.missing_counts).map(([col, count]) => ({
                      label: col,
                      value: count,
                      subtext: `${summary.missing_percentages[col]}% missing`,
                    }))}
                    maxValue={summary.rows}
                    color="bg-amber-500"
                    unit="rows"
                  />
                </div>

                {/* Data Quality Report Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">
                      Data Hygiene & Leakage Risk Audit
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="font-semibold text-slate-800 mb-1 flex items-center justify-between">
                          <span>Duplicate Row Audit:</span>
                          <span className={`font-mono tabular-nums ${summary.duplicate_rows > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>
                            {summary.duplicate_rows} duplicate rows detected
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {summary.duplicate_rows > 0
                            ? 'Duplicates can bias model evaluation if split across train and test sets. We recommend removing them before splitting.'
                            : 'Zero duplicate rows detected. Clean dataset instance.'}
                        </p>
                        {summary.duplicate_rows > 0 && (
                          <button
                            onClick={handleRemoveDuplicates}
                            disabled={cleaning}
                            className="mt-2 px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                          >
                            {cleaning ? 'Removing duplicates...' : 'Clean Duplicate Rows Now'}
                          </button>
                        )}
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="font-semibold text-slate-800 mb-1">
                          Detected Identifier Columns:
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {summary.detected_features.id_like.length > 0 ? (
                            <span className="text-indigo-600 font-mono">
                              {summary.detected_features.id_like.join(', ')}
                            </span>
                          ) : (
                            'No obvious high-cardinality IDs detected.'
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          ID columns will be excluded by default during feature selection to prevent memorization.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="font-semibold text-slate-800 mb-1">
                          Zero-Variance (Constant) Columns:
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {summary.detected_features.constant.length > 0 ? (
                            <span className="text-rose-600 font-mono">
                              {summary.detected_features.constant.join(', ')}
                            </span>
                          ) : (
                            'All columns exhibit statistical variation.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                    ModelForge AI automatically runs median imputation on numeric features and most-frequent imputation on categorical features inside each cross-validation fold.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESCRIPTIVE STATISTICS */}
          {activeTab === 'stats' && summary && (
            <div className="space-y-6">
              {/* Numerical summary table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900">
                    Descriptive Statistics for Numerical Features
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mean, dispersion, median, and quartile boundaries
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
                        <th className="py-2.5 px-3">Column</th>
                        <th className="py-2.5 px-3 text-right">Count</th>
                        <th className="py-2.5 px-3 text-right">Mean</th>
                        <th className="py-2.5 px-3 text-right">Std Dev</th>
                        <th className="py-2.5 px-3 text-right">Min</th>
                        <th className="py-2.5 px-3 text-right">25% (Q1)</th>
                        <th className="py-2.5 px-3 text-right">50% (Median)</th>
                        <th className="py-2.5 px-3 text-right">75% (Q3)</th>
                        <th className="py-2.5 px-3 text-right">Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(summary.numeric_stats).map(([col, stats]) => (
                        <tr key={col} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{col}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">{stats.count}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">{stats.mean}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">{stats.std}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">{stats.min}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">{stats.q25}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-indigo-700">{stats.median}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">{stats.q75}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">{stats.max}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Categorical summary table */}
              {Object.keys(summary.categorical_stats).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-900">
                      Categorical Features Summary
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Unique categories, top value (Mode), and frequency distributions
                    </p>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(summary.categorical_stats).map(([col, stats]) => (
                      <div key={col} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800">{col}</span>
                          <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {stats.unique} unique
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mb-2">
                          Most frequent: <strong className="text-slate-900">{stats.top}</strong> ({stats.top_freq} occurrences)
                        </div>
                        <div className="space-y-1">
                          {Object.entries(stats.sample_values).map(([val, freq]) => (
                            <div key={val} className="flex justify-between text-[11px] text-slate-500">
                              <span className="truncate max-w-[140px]">{val}</span>
                              <span className="font-mono tabular-nums">{freq}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VISUALIZATIONS & CORRELATIONS */}
          {activeTab === 'visualizations' && visualizations && (
            <div className="space-y-6">
              {/* Correlation Heatmap */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <CorrelationHeatmap
                  columns={visualizations.correlation.columns}
                  matrix={visualizations.correlation.matrix}
                />
              </div>

              {/* Categorical Distribution Charts */}
              {Object.keys(visualizations.categorical_distributions).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">
                    Categorical Feature Class Proportions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(visualizations.categorical_distributions).map(([col, dist]) => (
                      <div key={col} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-800 mb-3">{col}</h4>
                        <BarChart
                          data={dist.map((d) => ({ label: d.category, value: d.count }))}
                          color="bg-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
