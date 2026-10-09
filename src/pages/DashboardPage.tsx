import React from 'react';
import {
  Database,
  BrainCircuit,
  SlidersHorizontal,
  TrendingUp,
  ArrowRight,
  Upload,
  CheckCircle2,
  FileSpreadsheet,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { DatasetMeta, ModelMeta } from '../types';
import { MetricCard } from '../components/ui/MetricCard';

interface DashboardPageProps {
  datasets: DatasetMeta[];
  models: ModelMeta[];
  onNavigate: (tab: string, context?: { datasetId?: string; modelId?: string }) => void;
  onOpenUpload: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  datasets,
  models,
  onNavigate,
  onOpenUpload,
}) => {
  const classificationCount = models.filter((m) => m.task_type === 'classification').length;
  const regressionCount = models.filter((m) => m.task_type === 'regression').length;

  return (
    <div className="space-y-8">
      {/* Welcome & Overview Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>Strict Zero-Leakage Pipeline Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome to ModelForge AI
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            An end-to-end full-stack machine learning workbench for tabular dataset exploration,
            automated preprocessing, hyperparameter optimization, model evaluation, and dynamic
            predictions.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs active:scale-98"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV Dataset</span>
            </button>
            <button
              onClick={() => onNavigate('training')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors active:scale-98"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Start Model Training</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Datasets Indexed"
          value={datasets.length}
          subtext="Ready for exploratory analysis"
          tooltip="Total number of uploaded and seeded CSV datasets in storage"
          badge={datasets.length > 0 ? 'Active' : 'Empty'}
          badgeType={datasets.length > 0 ? 'success' : 'info'}
        />
        <MetricCard
          label="Models Trained"
          value={models.length}
          subtext={`${classificationCount} Classification · ${regressionCount} Regression`}
          tooltip="Persisted trained scikit-learn pipelines with complete feature transformers"
        />
        <MetricCard
          label="Supported Algorithms"
          value="11"
          subtext="6 Classification · 5 Regression"
          tooltip="Includes Logistic Regression, Random Forest, SVR, Polynomial Regression, etc."
        />
        <MetricCard
          label="Data Leakage Guard"
          value="100%"
          subtext="CV pipelines strictly isolated"
          tooltip="Imputation, scaling, and encoding fit strictly on training folds"
          badge="Guaranteed"
          badgeType="success"
        />
      </div>

      {/* Quick Entry Points: Classification & Regression */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Classification Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between hover:border-indigo-300 transition-colors shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Classification Track
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                6 Algorithms
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Discrete Target Classification
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Train Logistic Regression, Random Forest, Decision Tree, KNN, Gaussian Naive Bayes,
              and Support Vector Machines with stratified splitting, class report breakdowns, and
              ROC-AUC evaluation.
            </p>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 space-y-1">
              <div className="font-semibold text-slate-700">Pre-seeded Benchmark:</div>
              <div className="text-slate-500">
                Student Placement Dataset (Target: <code className="text-indigo-600 font-mono">Placement_Status</code>)
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('training', { datasetId: 'ds_student_placement' })}
            className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <span>Train Classification Model</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Regression Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 flex flex-col justify-between hover:border-indigo-300 transition-colors shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Regression Track
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                5 Algorithms
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Continuous Target Regression
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Model continuous quantities with Linear Regression, Polynomial Regression (degree 2),
              Decision Trees, Random Forests, and Support Vector Regression with MAE, MSE, RMSE, and
              R² metrics.
            </p>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 space-y-1">
              <div className="font-semibold text-slate-700">Pre-seeded Benchmark:</div>
              <div className="text-slate-500">
                House Price Dataset (Target: <code className="text-emerald-600 font-mono">Price_Lakhs</code>)
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('training', { datasetId: 'ds_house_prices' })}
            className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <span>Train Regression Model</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recents Section: Datasets & Trained Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Datasets */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Available Datasets</span>
            </h3>
            <button
              onClick={() => onNavigate('explorer')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              View Explorer →
            </button>
          </div>

          {datasets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No datasets available yet. Click "Upload CSV" above to begin.
            </div>
          ) : (
            <div className="space-y-2">
              {datasets.slice(0, 4).map((ds) => (
                <div
                  key={ds.id}
                  onClick={() => onNavigate('explorer', { datasetId: ds.id })}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">{ds.name}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono tabular-nums">{ds.rows} rows</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{ds.columns} cols</span>
                      <span>·</span>
                      <span className="capitalize">{ds.suggested_task}</span>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Explore →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Models */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Trained Models</span>
            </h3>
            <button
              onClick={() => onNavigate('models')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              View All ({models.length}) →
            </button>
          </div>

          {models.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No models trained yet. Go to "Model Training" to configure and train your first model.
            </div>
          ) : (
            <div className="space-y-2">
              {models.slice(0, 4).map((m) => (
                <div
                  key={m.model_id}
                  onClick={() => onNavigate('evaluation', { modelId: m.model_id })}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">{m.name}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="capitalize">{m.task_type}</span>
                      <span>·</span>
                      <span>
                        {m.task_type === 'classification'
                          ? `Acc: ${(m.metrics?.test_accuracy * 100).toFixed(1)}%`
                          : `R²: ${m.metrics?.test_r2?.toFixed(3)}`}
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{m.created_at}</span>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Metrics →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* End-to-End Workflow Diagram / Overview */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          End-to-End Machine Learning Workflow
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Step-by-step rigorous methodology designed for college laboratories and production ML workflows
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { step: '01', title: 'Data Upload', desc: 'CSV format, encoding check & validation' },
            { step: '02', title: 'EDA & Clean', desc: 'Missing stats, duplicates & distributions' },
            { step: '03', title: 'Feature Setup', desc: 'Target selection, leakage & ID exclusion' },
            { step: '04', title: 'Train & Tune', desc: 'Pipeline CV & GridSearchCV optimization' },
            { step: '05', title: 'Evaluate', desc: 'Held-out test set metrics, ROC & residuals' },
            { step: '06', title: 'Predict', desc: 'Single sample or batch CSV inference' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-indigo-600 font-mono block mb-1">
                {item.step}
              </span>
              <h4 className="text-xs font-semibold text-slate-800 mb-1">{item.title}</h4>
              <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
