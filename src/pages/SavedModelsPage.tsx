import React, { useState } from 'react';
import {
  Bookmark,
  Trash2,
  Play,
  Activity,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ModelMeta } from '../types';
import { deleteModel } from '../services/api';

interface SavedModelsPageProps {
  models: ModelMeta[];
  onSelectForPrediction: (modelId: string) => void;
  onSelectForEvaluation: (modelId: string) => void;
  onModelDeleted: (modelId: string) => void;
  onNavigateToTraining: () => void;
}

export const SavedModelsPage: React.FC<SavedModelsPageProps> = ({
  models,
  onSelectForPrediction,
  onSelectForEvaluation,
  onModelDeleted,
  onNavigateToTraining,
}) => {
  const [modelToDelete, setModelToDelete] = useState<ModelMeta | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!modelToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteModel(modelToDelete.model_id);
      onModelDeleted(modelToDelete.model_id);
      setModelToDelete(null);
      setDeleting(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete model');
      setDeleting(false);
    }
  };

  if (models.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <Bookmark className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 mb-1">No Saved Models</h3>
        <p className="text-xs text-slate-500 mb-6">
          Every model trained in ModelForge AI is automatically serialized with joblib along with its
          complete preprocessing pipeline. Train your first model to see it listed here.
        </p>
        <button
          onClick={onNavigateToTraining}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
        >
          Train a Model Now
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
            Persisted Model Registry & Pipeline Store
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Serialized scikit-learn models and ColumnTransformer pipelines stored on disk
          </p>
        </div>

        <button
          onClick={onNavigateToTraining}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
        >
          + Train New Model
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m) => {
          const isCls = m.task_type === 'classification';
          const primaryScore = isCls
            ? `${(m.metrics?.test_accuracy * 100).toFixed(1)}% Acc`
            : `R²: ${m.metrics?.test_r2?.toFixed(3)}`;

          return (
            <div
              key={m.model_id}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                      isCls ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {m.task_type} · {m.algorithm_name}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                    {primaryScore}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1 truncate" title={m.name}>
                  {m.name}
                </h3>
                <p className="text-xs text-slate-500 mb-3 truncate">
                  Dataset: {m.dataset_name} · Target: <code className="font-mono text-indigo-600">{m.target_col}</code>
                </p>

                <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 mb-4">
                  <div className="flex justify-between">
                    <span>Feature count:</span>
                    <strong className="font-mono tabular-nums text-slate-700">{m.feature_count} features</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tuned via CV:</span>
                    <strong className="text-slate-700">{m.enable_tuning ? 'Yes (GridSearchCV)' : 'No (Default)'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Persisted format:</span>
                    <span className="font-mono text-[10px] text-slate-400">joblib + metadata JSON</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saved date:</span>
                    <span className="font-mono tabular-nums text-slate-400">{m.created_at}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectForEvaluation(m.model_id)}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    Evaluation
                  </button>
                  <button
                    onClick={() => onSelectForPrediction(m.model_id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                  >
                    <Play className="w-3 h-3 fill-indigo-700" />
                    <span>Predict</span>
                  </button>
                </div>

                <button
                  onClick={() => setModelToDelete(m)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Delete Model"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Security Notice */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Security Safeguard:</strong> All saved models are stored with sanitized
          unique IDs in the protected local storage directory. User-supplied arbitrary binary pickle or joblib
          files are strictly rejected to prevent remote code execution vulnerabilities.
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {modelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Delete Trained Model?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">{modelToDelete.name}</strong>?
              This will remove the serialized joblib pipeline and metadata from disk. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setModelToDelete(null)}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                {deleting ? 'Deleting...' : 'Delete Model'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
