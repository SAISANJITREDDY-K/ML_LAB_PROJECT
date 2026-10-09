import React, { useState } from 'react';
import {
  Scale,
  ArrowUpDown,
  Trophy,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ModelMeta } from '../types';

interface ModelComparisonPageProps {
  models: ModelMeta[];
  onSelectModel: (modelId: string) => void;
  onNavigateToTraining: () => void;
}

export const ModelComparisonPage: React.FC<ModelComparisonPageProps> = ({
  models,
  onSelectModel,
  onNavigateToTraining,
}) => {
  const [filterTask, setFilterTask] = useState<'all' | 'classification' | 'regression'>('all');
  const [sortKey, setSortKey] = useState<string>('primary');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredModels = models.filter((m) => {
    if (filterTask === 'all') return true;
    return m.task_type === filterTask;
  });

  // Determine sorted models
  const sortedModels = [...filteredModels].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    if (sortKey === 'primary') {
      if (a.task_type === 'classification') {
        valA = a.metrics?.f1_weighted ?? a.metrics?.test_accuracy ?? 0;
        valB = b.metrics?.f1_weighted ?? b.metrics?.test_accuracy ?? 0;
      } else {
        valA = a.metrics?.test_r2 ?? 0;
        valB = b.metrics?.test_r2 ?? 0;
      }
    } else if (sortKey === 'cv_score') {
      valA = a.best_cv_score ?? 0;
      valB = b.best_cv_score ?? 0;
    } else if (sortKey === 'duration') {
      valA = a.training_duration;
      valB = b.training_duration;
    } else if (sortKey === 'latency') {
      valA = a.metrics?.prediction_time ?? 0;
      valB = b.metrics?.prediction_time ?? 0;
    }

    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const bestModel = sortedModels.length > 0 ? sortedModels[0] : null;

  if (models.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <Scale className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 mb-1">No Models to Compare</h3>
        <p className="text-xs text-slate-500 mb-6">
          Train at least two candidate estimators to evaluate them side-by-side across accuracy,
          F1-score, RMSE, CV stability, and training latency.
        </p>
        <button
          onClick={onNavigateToTraining}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
        >
          Train Candidate Models
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Multi-Model Evaluation & Leaderboard Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare model performance on identical held-out test splits with cross-validation stability
          </p>
        </div>

        {/* Task Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilterTask('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterTask === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Tasks ({models.length})
          </button>
          <button
            onClick={() => setFilterTask('classification')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterTask === 'classification' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Classification
          </button>
          <button
            onClick={() => setFilterTask('regression')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterTask === 'regression' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Regression
          </button>
        </div>
      </div>

      {/* Best Model Banner */}
      {bestModel && (
        <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-200/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-900">
                  Top Ranked Estimator: {bestModel.name}
                </span>
                <span className="text-[11px] font-mono text-indigo-700 bg-white/80 px-2 py-0.5 rounded border border-indigo-200">
                  {bestModel.task_type === 'classification'
                    ? `F1: ${bestModel.metrics?.f1_weighted?.toFixed(3)}`
                    : `R²: ${bestModel.metrics?.test_r2?.toFixed(3)}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Evaluated against identical benchmark split. Cross-validation score on train subset:{' '}
                <strong className="font-mono tabular-nums text-slate-800">
                  {bestModel.best_cv_score !== null ? bestModel.best_cv_score.toFixed(4) : 'N/A (Standard fit)'}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectModel(bestModel.model_id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200 shadow-xs"
          >
            <span>View Full Evaluation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            Comparing {sortedModels.length} Trained Estimators
          </span>
          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
            >
              <option value="primary">Primary Score (F1 / R²)</option>
              <option value="cv_score">Train Cross-Validation Score</option>
              <option value="duration">Training Fit Duration</option>
              <option value="latency">Prediction Latency</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
                <th className="py-2.5 px-3">Algorithm</th>
                <th className="py-2.5 px-3">Dataset</th>
                <th className="py-2.5 px-3">Task</th>
                <th className="py-2.5 px-3 text-right">Features</th>
                <th className="py-2.5 px-3 text-right">Train Score</th>
                <th className="py-2.5 px-3 text-right">Test Score (Held-Out)</th>
                <th className="py-2.5 px-3 text-right">CV Score (Train)</th>
                <th className="py-2.5 px-3 text-right">Fit Time</th>
                <th className="py-2.5 px-3 text-right">Latency</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedModels.map((m, idx) => {
                const isCls = m.task_type === 'classification';
                const trainScore = isCls ? m.metrics?.train_accuracy : m.metrics?.train_r2;
                const testScore = isCls ? m.metrics?.f1_weighted : m.metrics?.test_r2;

                return (
                  <tr
                    key={m.model_id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      idx === 0 ? 'bg-indigo-50/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {idx === 0 && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        <span>{m.algorithm_name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{m.dataset_name}</td>
                    <td className="py-2.5 px-3 capitalize">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          isCls ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {m.task_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {m.feature_count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {trainScore !== undefined ? trainScore.toFixed(3) : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-indigo-700">
                      {testScore !== undefined ? testScore.toFixed(3) : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {m.best_cv_score !== null ? m.best_cv_score.toFixed(3) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                      {m.training_duration}s
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                      {(m.metrics?.prediction_time * 1000).toFixed(1)}ms
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectModel(m.model_id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology Callout */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Sound Model Selection Methodology:</strong> In rigorous machine
          learning, hyperparameter tuning and model architecture decisions must be guided by
          cross-validation results on the training subset. The final held-out test split is preserved
          strictly for impartial validation to prevent test-set overfitting (data leakage).
        </div>
      </div>
    </div>
  );
};
