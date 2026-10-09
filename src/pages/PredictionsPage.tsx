import React, { useState } from 'react';
import {
  BrainCircuit,
  Play,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
  RefreshCw,
  Info,
} from 'lucide-react';
import { ModelMeta, PredictionResult } from '../types';
import { runPrediction } from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface PredictionsPageProps {
  models: ModelMeta[];
  selectedModelId: string | null;
  onSelectModelId: (modelId: string) => void;
  onNavigateToTraining: () => void;
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({
  models,
  selectedModelId,
  onSelectModelId,
  onNavigateToTraining,
}) => {
  const activeModel =
    models.find((m) => m.model_id === selectedModelId) || (models.length > 0 ? models[0] : null);

  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [singleResult, setSingleResult] = useState<PredictionResult | null>(null);
  const [batchResults, setBatchResults] = useState<PredictionResult[] | null>(null);
  const [batchRows, setBatchRows] = useState<Record<string, any>[]>([]);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form defaults when active model changes
  React.useEffect(() => {
    if (!activeModel) return;
    const initial: Record<string, any> = {};
    activeModel.schema.selected_features.forEach((feat) => {
      const details = activeModel.schema.feature_details[feat];
      if (details?.type === 'numeric') {
        initial[feat] = details.median ?? 0;
      } else if (details?.type === 'categorical') {
        initial[feat] = details.default || (details.options?.[0] ?? '');
      } else {
        initial[feat] = '';
      }
    });
    setFormData(initial);
    setSingleResult(null);
    setBatchResults(null);
    setError(null);
  }, [activeModel?.model_id]);

  const handleInputChange = (feat: string, val: any) => {
    setFormData((prev) => ({ ...prev, [feat]: val }));
  };

  const handleSinglePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModel) return;
    setPredicting(true);
    setError(null);
    try {
      const results = await runPrediction(activeModel.model_id, [formData]);
      setSingleResult(results[0] || null);
      setPredicting(false);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
      setPredicting(false);
    }
  };

  const handleBatchCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setError('Batch CSV must have a header row and at least 1 record.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const parsedRows: Record<string, any>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, any> = {};
        headers.forEach((h, idx) => {
          row[h] = vals[idx] ?? '';
        });
        parsedRows.push(row);
      }

      setBatchRows(parsedRows);
    };
    reader.readAsText(file);
  };

  const handleRunBatchPredict = async () => {
    if (!activeModel || batchRows.length === 0) return;
    setPredicting(true);
    setError(null);
    try {
      const results = await runPrediction(activeModel.model_id, batchRows);
      setBatchResults(results);
      setPredicting(false);
    } catch (err: any) {
      setError(err.message || 'Batch prediction failed');
      setPredicting(false);
    }
  };

  const handleDownloadBatchCSV = () => {
    if (!batchResults || !batchRows || batchRows.length === 0) return;

    const headers = [...Object.keys(batchRows[0]), `Predicted_${activeModel?.target_col || 'Output'}`];
    const rows = batchRows.map((row, idx) => {
      const pred = batchResults[idx]?.prediction ?? '';
      return [...Object.values(row), pred].map((v) => JSON.stringify(v)).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `predictions_${activeModel?.model_id}.csv`;
    link.click();
  };

  if (!activeModel) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <BrainCircuit className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 mb-1">No Model Selected for Prediction</h3>
        <p className="text-xs text-slate-500 mb-6">
          Train a model first before making interactive single-sample or batch inference predictions.
        </p>
        <button
          onClick={onNavigateToTraining}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
        >
          Train a Model
        </button>
      </div>
    );
  }

  const isClassification = activeModel.task_type === 'classification';

  return (
    <div className="space-y-6">
      {/* Top Model Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="predict-model-select" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Inference Model:
          </label>
          <select
            id="predict-model-select"
            value={activeModel.model_id}
            onChange={(e) => onSelectModelId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 max-w-md truncate"
          >
            {models.map((m) => (
              <option key={m.model_id} value={m.model_id}>
                {m.name} ({m.task_type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setMode('single')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              mode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single Sample Form
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              mode === 'batch' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batch CSV Inference
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* MODE 1: SINGLE SAMPLE INFERENCE */}
      {mode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dynamic Form Column */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Input Feature Values for Prediction
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically generated inputs tailored to the model's exact preprocessing schema
              </p>
            </div>

            <form onSubmit={handleSinglePredict} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeModel.schema.selected_features.map((feat) => {
                  const details = activeModel.schema.feature_details[feat];
                  const isNum = details?.type === 'numeric';

                  return (
                    <div key={feat}>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {feat} {isNum ? <span className="text-slate-400 font-normal font-mono">(Num)</span> : <span className="text-slate-400 font-normal font-mono">(Cat)</span>}
                      </label>
                      {isNum ? (
                        <div>
                          <input
                            type="number"
                            step="any"
                            value={formData[feat] ?? ''}
                            onChange={(e) => handleInputChange(feat, parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                            placeholder={`e.g. ${details?.median ?? 0}`}
                            required
                          />
                          {details && (
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono tabular-nums">
                              Range in training: {details.min} to {details.max}
                            </span>
                          )}
                        </div>
                      ) : (
                        <select
                          value={formData[feat] ?? ''}
                          onChange={(e) => handleInputChange(feat, e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                          required
                        >
                          {(details?.options || []).map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={predicting}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-all shadow-xs"
                >
                  {predicting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Computing Prediction...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Generate Prediction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results Column */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Model Inference Result
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target: <strong className="text-slate-800 font-mono">{activeModel.target_col}</strong>
                </p>
              </div>

              {singleResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                      Predicted Output
                    </span>
                    <div className="text-3xl font-extrabold text-indigo-700 font-mono tracking-tight">
                      {isClassification ? singleResult.prediction : Number(singleResult.prediction).toFixed(2)}
                    </div>
                    {singleResult.confidence && (
                      <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 inline-block px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-mono tabular-nums">
                        {singleResult.confidence}% Model Confidence
                      </div>
                    )}
                  </div>

                  {/* Probabilities Breakdown */}
                  {singleResult.probabilities && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-800">
                        Class Probability Distribution:
                      </div>
                      {Object.entries(singleResult.probabilities).map(([cls, prob]) => (
                        <div key={cls}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-700 font-medium">{cls}</span>
                            <span className="font-mono tabular-nums text-slate-900 font-bold">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all"
                              style={{ width: `${Math.max(2, prob * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{singleResult.confidence_disclaimer}</span>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center text-xs text-slate-400">
                  Fill in the input features and click "Generate Prediction" to compute real model outputs.
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
              Evaluated strictly through the fitted <code className="font-mono">ColumnTransformer</code> and estimator pipeline.
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: BATCH CSV INFERENCE */}
      {mode === 'batch' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Batch Prediction from CSV File
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a CSV containing multiple records with the required input features
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors border border-slate-200">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose CSV File</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleBatchCSVUpload}
                className="hidden"
              />
            </label>

            {batchRows.length > 0 && (
              <button
                onClick={handleRunBatchPredict}
                disabled={predicting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
              >
                {predicting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Predicting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Run Predictions on {batchRows.length} Rows</span>
                  </>
                )}
              </button>
            )}

            {batchResults && (
              <button
                onClick={handleDownloadBatchCSV}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Predictions CSV</span>
              </button>
            )}
          </div>

          {/* Batch table preview */}
          {batchRows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[380px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600 sticky top-0">
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    {Object.keys(batchRows[0]).slice(0, 6).map((k) => (
                      <th key={k} className="py-2.5 px-3 whitespace-nowrap">
                        {k}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 font-bold text-indigo-700 bg-indigo-50/80">
                      Predicted {activeModel.target_col}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchRows.slice(0, 30).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      {Object.keys(batchRows[0]).slice(0, 6).map((k) => (
                        <td key={k} className="py-2 px-3 whitespace-nowrap text-slate-700 font-mono tabular-nums">
                          {String(row[k])}
                        </td>
                      ))}
                      <td className="py-2 px-3 whitespace-nowrap font-bold text-indigo-700 font-mono tabular-nums bg-indigo-50/20">
                        {batchResults ? String(batchResults[idx]?.prediction) : 'Pending run'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
