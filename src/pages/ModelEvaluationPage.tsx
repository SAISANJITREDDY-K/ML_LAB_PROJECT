import React, { useState } from 'react';
import {
  BrainCircuit,
  Sliders,
  CheckCircle2,
  Clock,
  Download,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { ModelMeta } from '../types';
import { MetricCard } from '../components/ui/MetricCard';
import { ConfusionMatrix } from '../components/ui/ConfusionMatrix';
import { RocCurve } from '../components/ui/RocCurve';
import { ScatterPlot } from '../components/ui/ScatterPlot';
import { ResidualPlot } from '../components/ui/ResidualPlot';

interface ModelEvaluationPageProps {
  models: ModelMeta[];
  selectedModelId: string | null;
  onSelectModelId: (modelId: string) => void;
  onNavigateToPredictions: (modelId: string) => void;
  onNavigateToTraining: () => void;
}

export const ModelEvaluationPage: React.FC<ModelEvaluationPageProps> = ({
  models,
  selectedModelId,
  onSelectModelId,
  onNavigateToPredictions,
  onNavigateToTraining,
}) => {
  const activeModel =
    models.find((m) => m.model_id === selectedModelId) || (models.length > 0 ? models[0] : null);

  const [activeTab, setActiveTab] = useState<'metrics' | 'diagnostics' | 'tuning'>('metrics');

  const handleDownloadReport = () => {
    if (!activeModel) return;
    const jsonStr = JSON.stringify(activeModel, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeModel.model_id}_evaluation_report.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!activeModel) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <Activity className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 mb-1">No Models Evaluated Yet</h3>
        <p className="text-xs text-slate-500 mb-6">
          Train a classification or regression model to inspect detailed held-out performance metrics,
          confusion matrices, and error distributions.
        </p>
        <button
          onClick={onNavigateToTraining}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
        >
          Go to Model Training
        </button>
      </div>
    );
  }

  const isClassification = activeModel.task_type === 'classification';
  const metrics = activeModel.metrics;

  return (
    <div className="space-y-6">
      {/* Top Bar: Model Selector & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="model-select" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Active Model:
          </label>
          <select
            id="model-select"
            value={activeModel.model_id}
            onChange={(e) => onSelectModelId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 max-w-md truncate"
          >
            {models.map((m) => (
              <option key={m.model_id} value={m.model_id}>
                {m.name} ({m.task_type.toUpperCase()} · {m.created_at})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Evaluation JSON</span>
          </button>
          <button
            onClick={() => onNavigateToPredictions(activeModel.model_id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            <span>Predict with Model →</span>
          </button>
        </div>
      </div>

      {/* Model Overview Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded capitalize">
                {activeModel.algorithm_name}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600 font-medium">{activeModel.dataset_name}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{activeModel.name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span>Target: <strong className="text-slate-800 font-mono">{activeModel.target_col}</strong></span>
              <span>·</span>
              <span>Features: <strong className="font-mono tabular-nums">{activeModel.feature_count}</strong></span>
              <span>·</span>
              <span>Split: <strong className="font-mono tabular-nums">{Math.round((1 - activeModel.test_size) * 100)}% Train / {Math.round(activeModel.test_size * 100)}% Held-Out Test</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="font-mono tabular-nums">{activeModel.training_duration}s fit time</span>
              </span>
            </div>
          </div>

          {activeModel.enable_tuning && activeModel.best_cv_score !== null && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-right">
              <div className="text-[11px] font-semibold text-amber-800">GridSearchCV Best CV Score</div>
              <div className="text-lg font-bold text-amber-900 font-mono tabular-nums">
                {activeModel.best_cv_score.toFixed(4)}
              </div>
              <div className="text-[10px] text-amber-700 font-mono tabular-nums mt-0.5">
                {activeModel.cv_folds}-fold CV on train subset
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-px">
        {[
          { id: 'metrics', label: 'Primary Metrics' },
          { id: 'diagnostics', label: isClassification ? 'Confusion & ROC Curve' : 'Parity & Residual Error' },
          { id: 'tuning', label: 'Hyperparameter Tuning Log' },
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

      {/* TAB 1: PRIMARY METRICS */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {isClassification ? (
            /* Classification Cards */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard
                label="Held-Out Test Accuracy"
                value={`${(metrics.test_accuracy * 100).toFixed(1)}%`}
                subtext={`Train: ${(metrics.train_accuracy * 100).toFixed(1)}%`}
                tooltip="Proportion of held-out test instances correctly classified"
                badge={metrics.test_accuracy > 0.8 ? 'Strong' : 'Evaluated'}
                badgeType="success"
              />
              <MetricCard
                label="F1-Score (Weighted)"
                value={metrics.f1_weighted?.toFixed(3) ?? 'N/A'}
                subtext={`Macro: ${metrics.f1_macro?.toFixed(3) ?? 'N/A'}`}
                tooltip="Harmonic mean of precision and recall accounting for class proportions"
              />
              <MetricCard
                label="Precision (Weighted)"
                value={metrics.precision_weighted?.toFixed(3) ?? 'N/A'}
                subtext={`Macro: ${metrics.precision_macro?.toFixed(3) ?? 'N/A'}`}
                tooltip="Ratio of true positives over all positive predictions"
              />
              <MetricCard
                label="Recall (Weighted)"
                value={metrics.recall_weighted?.toFixed(3) ?? 'N/A'}
                subtext={`Macro: ${metrics.recall_macro?.toFixed(3) ?? 'N/A'}`}
                tooltip="Ratio of true positives over all actual positive ground truth cases"
              />
              <MetricCard
                label="ROC-AUC Score"
                value={metrics.roc_auc !== null ? metrics.roc_auc.toFixed(3) : 'N/A'}
                subtext={metrics.roc_auc_status}
                tooltip="Area under the Receiver Operating Characteristic curve"
              />
              <MetricCard
                label="Inference Latency"
                value={`${(metrics.prediction_time * 1000).toFixed(1)}ms`}
                subtext="Test set prediction duration"
                tooltip="Time taken to pass held-out test samples through fitted pipeline"
              />
            </div>
          ) : (
            /* Regression Cards */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard
                label="Held-Out Test R²"
                value={metrics.test_r2?.toFixed(3) ?? 'N/A'}
                subtext={`Train: ${metrics.train_r2?.toFixed(3) ?? 'N/A'}`}
                tooltip="Coefficient of determination: proportion of variance explained by model"
                badge={metrics.test_r2 > 0.7 ? 'Strong Fit' : 'Computed'}
                badgeType="success"
              />
              <MetricCard
                label="Root Mean Sq Error (RMSE)"
                value={metrics.test_rmse?.toFixed(3) ?? 'N/A'}
                subtext={`Train: ${metrics.train_rmse?.toFixed(3) ?? 'N/A'}`}
                tooltip="Square root of Mean Squared Error, in original target units"
              />
              <MetricCard
                label="Mean Absolute Error (MAE)"
                value={metrics.test_mae?.toFixed(3) ?? 'N/A'}
                subtext={`Train: ${metrics.train_mae?.toFixed(3) ?? 'N/A'}`}
                tooltip="Average magnitude of the errors without considering direction"
              />
              <MetricCard
                label="Mean Squared Error (MSE)"
                value={metrics.test_mse?.toFixed(3) ?? 'N/A'}
                subtext={`Train: ${metrics.train_mse?.toFixed(3) ?? 'N/A'}`}
                tooltip="Average squared difference between predicted and actual values"
              />
              <MetricCard
                label="Input Features"
                value={activeModel.feature_count}
                subtext={`${activeModel.schema.numeric_features.length} num · ${activeModel.schema.categorical_features.length} cat`}
                tooltip="Number of input predictors fed into the ColumnTransformer"
              />
              <MetricCard
                label="Inference Latency"
                value={`${(metrics.prediction_time * 1000).toFixed(1)}ms`}
                subtext="Test set batch evaluation"
                tooltip="Time taken to compute regression predictions on held-out test split"
              />
            </div>
          )}

          {/* Secondary Report Table */}
          {isClassification && metrics.per_class_metrics && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">
                  Class-Wise Classification Performance Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed evaluation breakdown per distinct target class on the held-out test set
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
                      <th className="py-2.5 px-3">Target Class</th>
                      <th className="py-2.5 px-3 text-right">Precision</th>
                      <th className="py-2.5 px-3 text-right">Recall</th>
                      <th className="py-2.5 px-3 text-right">F1-Score</th>
                      <th className="py-2.5 px-3 text-right">Support (Count)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(metrics.per_class_metrics).map(([cls, report]) => (
                      <tr key={cls} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{cls}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          {report.precision.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          {report.recall.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-indigo-700">
                          {report.f1_score.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                          {report.support}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Binary classification breakdown if available */}
          {isClassification && metrics.binary_details && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Binary Classification Truth Matrix Summary
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Explicit Positive Class: <strong className="text-indigo-600">{metrics.binary_details.positive_class}</strong> · Negative Class: <strong className="text-slate-700">{metrics.binary_details.negative_class}</strong>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl">
                  <span className="text-[11px] text-emerald-700 font-semibold block">True Positives (TP)</span>
                  <span className="text-xl font-bold text-emerald-900 font-mono tabular-nums">{metrics.binary_details.tp}</span>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200/80 rounded-xl">
                  <span className="text-[11px] text-indigo-700 font-semibold block">True Negatives (TN)</span>
                  <span className="text-xl font-bold text-indigo-900 font-mono tabular-nums">{metrics.binary_details.tn}</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl">
                  <span className="text-[11px] text-rose-700 font-semibold block">False Positives (FP)</span>
                  <span className="text-xl font-bold text-rose-900 font-mono tabular-nums">{metrics.binary_details.fp}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl">
                  <span className="text-[11px] text-amber-700 font-semibold block">False Negatives (FN)</span>
                  <span className="text-xl font-bold text-amber-900 font-mono tabular-nums">{metrics.binary_details.fn}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIAGNOSTIC CHARTS */}
      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isClassification ? (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <ConfusionMatrix
                  matrix={metrics.confusion_matrix}
                  classes={metrics.classes}
                />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <RocCurve
                  rocCurve={metrics.roc_curve}
                  auc={metrics.roc_auc}
                  status={metrics.roc_auc_status}
                />
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <ScatterPlot
                  data={metrics.actual_vs_predicted}
                  title="Actual vs Predicted Values (Parity Line)"
                />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <ResidualPlot
                  residualPoints={metrics.residual_points}
                  residualDistribution={metrics.residual_distribution}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: TUNING LOG */}
      {activeTab === 'tuning' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Hyperparameter Configuration & Grid Search Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated parameter combinations fitted exclusively on training cross-validation subsets
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              Duration: {activeModel.tuning_duration}s
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Final Selected Hyperparameters:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeModel.best_params).map(([param, val]) => (
                <div
                  key={param}
                  className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs flex items-center gap-1.5"
                >
                  <span className="text-slate-500 font-medium">{param}:</span>
                  <span className="font-mono tabular-nums font-bold text-indigo-700">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {activeModel.cv_results_summary && activeModel.cv_results_summary.length > 0 ? (
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                Top Candidate Parameter Trials Tested in CV:
              </h4>
              <div className="space-y-1.5">
                {activeModel.cv_results_summary.map((trial, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="font-mono text-slate-700 truncate max-w-md">
                      {JSON.stringify(trial.params)}
                    </div>
                    <div className="font-mono tabular-nums text-right shrink-0">
                      <span className="font-bold text-indigo-600">{trial.mean_score.toFixed(4)}</span>
                      <span className="text-[11px] text-slate-400 ml-1">±{trial.std_score.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 p-4">
              Standard training mode used (hyperparameter tuning was disabled for this run).
            </div>
          )}
        </div>
      )}
    </div>
  );
};
