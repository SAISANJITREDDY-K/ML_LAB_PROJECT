import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  RefreshCw,
  Info,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';
import { DatasetMeta, DatasetSummary, ModelMeta, TaskType } from '../types';
import { fetchDatasetSummary, trainModel } from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface ModelTrainingPageProps {
  datasets: DatasetMeta[];
  initialDatasetId?: string | null;
  onTrainingComplete: (model: ModelMeta) => void;
  onNavigateToExplorer: (datasetId: string) => void;
}

const CLASSIFICATION_ALGORITHMS = [
  { id: 'logistic_regression', name: 'Logistic Regression', desc: 'Linear decision boundary with L2 regularization' },
  { id: 'decision_tree', name: 'Decision Tree Classifier', desc: 'Non-linear tree splits with configurable max depth' },
  { id: 'random_forest', name: 'Random Forest Classifier', desc: 'Ensemble bagging of decision trees' },
  { id: 'knn', name: 'K-Nearest Neighbors (KNN)', desc: 'Instance-based classification with Euclidean metric' },
  { id: 'naive_bayes', name: 'Gaussian Naive Bayes', desc: 'Probabilistic classifier with Gaussian class priors' },
  { id: 'svm', name: 'Support Vector Machine (SVC)', desc: 'RBF kernel margin maximization with probability calibration' },
];

const REGRESSION_ALGORITHMS = [
  { id: 'linear_regression', name: 'Linear Regression', desc: 'Ordinary least squares linear regression' },
  { id: 'polynomial_regression', name: 'Polynomial Regression (Deg 2)', desc: 'Quadratic feature interactions with linear fitting' },
  { id: 'decision_tree', name: 'Decision Tree Regressor', desc: 'Greedy variance-reduction partitioning' },
  { id: 'random_forest', name: 'Random Forest Regressor', desc: 'Averaged ensemble of randomized regression trees' },
  { id: 'svr', name: 'Support Vector Regression (SVR)', desc: 'Epsilon-insensitive margin regression with RBF kernel' },
];

export const ModelTrainingPage: React.FC<ModelTrainingPageProps> = ({
  datasets,
  initialDatasetId,
  onTrainingComplete,
  onNavigateToExplorer,
}) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(
    initialDatasetId || (datasets[0]?.id ?? '')
  );
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Training parameters
  const [targetCol, setTargetCol] = useState<string>('');
  const [taskType, setTaskType] = useState<TaskType>('classification');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [algorithm, setAlgorithm] = useState<string>('random_forest');
  const [testSize, setTestSize] = useState<number>(0.2);
  const [randomState, setRandomState] = useState<number>(42);
  const [numImpute, setNumImpute] = useState<string>('median');
  const [catImpute, setCatImpute] = useState<string>('most_frequent');
  const [scaleNumeric, setScaleNumeric] = useState<boolean>(true);
  const [enableTuning, setEnableTuning] = useState<boolean>(false);
  const [cvFolds, setCvFolds] = useState<number>(5);
  const [scoringMetric, setScoringMetric] = useState<string>('f1_weighted');

  // Execution states
  const [training, setTraining] = useState<boolean>(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  // Load summary whenever dataset changes
  useEffect(() => {
    if (!selectedDatasetId) return;
    loadSummary(selectedDatasetId);
  }, [selectedDatasetId]);

  const loadSummary = async (datasetId: string) => {
    setLoadingSummary(true);
    setTrainingError(null);
    try {
      const data = await fetchDatasetSummary(datasetId);
      setSummary(data);

      // Auto-set suggested target
      const target = data.suggested_target || data.column_names[data.column_names.length - 1];
      setTargetCol(target);

      // Auto-set suggested task
      const detectedTask = data.suggested_task || 'classification';
      setTaskType(detectedTask);
      setAlgorithm(detectedTask === 'classification' ? 'random_forest' : 'linear_regression');

      // Auto-select features (exclude target and ID columns)
      const excludeSet = new Set([target, ...(data.exclude_columns || [])]);
      const initialFeats = data.column_names.filter((c) => !excludeSet.has(c));
      setSelectedFeatures(initialFeats);

      setLoadingSummary(false);
    } catch (err: any) {
      setTrainingError(err.message || 'Failed to inspect dataset schema');
      setLoadingSummary(false);
    }
  };

  const handleTargetChange = (newTarget: string) => {
    setTargetCol(newTarget);
    // Never allow target in selected features (Leakage Prevention)
    setSelectedFeatures((prev) => prev.filter((f) => f !== newTarget));

    // Suggest task type based on target column
    if (summary) {
      const isNum = summary.numeric_columns.includes(newTarget);
      if (isNum && (summary.numeric_stats[newTarget]?.count || 0) > 10) {
        setTaskType('regression');
        setAlgorithm('linear_regression');
        setScoringMetric('r2');
      } else {
        setTaskType('classification');
        setAlgorithm('random_forest');
        setScoringMetric('f1_weighted');
      }
    }
  };

  const toggleFeature = (feat: string) => {
    if (feat === targetCol) return; // Prevent target selection
    setSelectedFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const selectAllFeatures = () => {
    if (!summary) return;
    setSelectedFeatures(summary.column_names.filter((c) => c !== targetCol));
  };

  const deselectAllFeatures = () => {
    setSelectedFeatures([]);
  };

  const handleTrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrainingError(null);

    if (!selectedDatasetId || !targetCol) {
      setTrainingError('Please select a dataset and a target column.');
      return;
    }

    if (selectedFeatures.length === 0) {
      setTrainingError('Please select at least one input feature for the model.');
      return;
    }

    if (selectedFeatures.includes(targetCol)) {
      setTrainingError(`Data leakage error: Target '${targetCol}' cannot be an input feature.`);
      return;
    }

    setTraining(true);
    try {
      const model = await trainModel({
        dataset_id: selectedDatasetId,
        target_col: targetCol,
        selected_features: selectedFeatures,
        task_type: taskType,
        algorithm: algorithm,
        test_size: Number(testSize),
        random_state: Number(randomState),
        num_impute: numImpute,
        cat_impute: catImpute,
        scale_numeric: scaleNumeric,
        enable_tuning: enableTuning,
        cv_folds: Number(cvFolds),
        scoring_metric: enableTuning ? scoringMetric : undefined,
        polynomial_degree: algorithm === 'polynomial_regression' ? 2 : 1,
      });

      setTraining(false);
      onTrainingComplete(model);
    } catch (err: any) {
      setTraining(false);
      setTrainingError(err.message || 'Model training failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Model Training & Hyperparameter Tuning Studio
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure dataset partitions, select estimators, and train with strict train-test separation
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Leakage Guard Active: Transformers isolated in CV</span>
          </div>
        </div>
      </div>

      {trainingError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Configuration Error:</p>
            <p className="mt-0.5">{trainingError}</p>
          </div>
        </div>
      )}

      {loadingSummary ? (
        <LoadingSpinner label="Inspecting dataset features and data types..." />
      ) : (
        <form onSubmit={handleTrainSubmit} className="space-y-6">
          {/* STEP 1: DATASET & TARGET SELECTION */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                1. Dataset & Target Definition
              </h3>
              {summary && (
                <button
                  type="button"
                  onClick={() => onNavigateToExplorer(selectedDatasetId)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Inspect in Explorer →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Active Dataset
                </label>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.rows} rows)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Column (Variable to Predict)
                </label>
                <select
                  value={targetCol}
                  onChange={(e) => handleTargetChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  {summary?.column_names.map((col) => (
                    <option key={col} value={col}>
                      {col} {summary.numeric_columns.includes(col) ? '(Numeric)' : '(Categorical)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Task Paradigm
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setTaskType('classification');
                      setAlgorithm('random_forest');
                      setScoringMetric('f1_weighted');
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      taskType === 'classification'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Classification
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskType('regression');
                      setAlgorithm('linear_regression');
                      setScoringMetric('r2');
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      taskType === 'regression'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Regression
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: FEATURE SELECTION */}
          {summary && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    2. Input Feature Selection
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select input predictor features. Obvious ID columns and target are safeguarded.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllFeatures}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllFeatures}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {summary.column_names.map((col) => {
                  const isTarget = col === targetCol;
                  const isChecked = selectedFeatures.includes(col);
                  const isNumeric = summary.numeric_columns.includes(col);
                  const isId = summary.detected_features.id_like.includes(col);

                  return (
                    <div
                      key={col}
                      onClick={() => !isTarget && toggleFeature(col)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isTarget
                          ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                          : isChecked
                          ? 'bg-indigo-50/50 border-indigo-200 text-slate-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isTarget}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-semibold text-slate-800" title={col}>
                          {col}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>{isNumeric ? 'Numeric' : 'Categorical'}</span>
                          {isTarget && <span className="text-indigo-600 font-bold">· Target</span>}
                          {isId && <span className="text-amber-600 font-bold">· ID</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2">
                <span>
                  Selected Features:{' '}
                  <strong className="text-slate-800 font-mono tabular-nums">
                    {selectedFeatures.length}
                  </strong>{' '}
                  of {summary.column_names.length - 1} eligible
                </span>
                {selectedFeatures.length === 0 && (
                  <span className="text-rose-600 font-semibold">
                    Warning: Select at least 1 feature to proceed
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: ALGORITHM & HYPERPARAMETERS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                3. Estimator Selection ({taskType === 'classification' ? 'Classification' : 'Regression'})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(taskType === 'classification' ? CLASSIFICATION_ALGORITHMS : REGRESSION_ALGORITHMS).map((algo) => (
                <div
                  key={algo.id}
                  onClick={() => setAlgorithm(algo.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    algorithm === algo.id
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{algo.name}</span>
                    <input
                      type="radio"
                      name="algorithm"
                      checked={algorithm === algo.id}
                      onChange={() => setAlgorithm(algo.id)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">{algo.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 4: PREPROCESSING & VALIDATION PIPELINE */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                4. Preprocessing & Data Leakage Prevention Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Numeric Imputation Strategy
                </label>
                <select
                  value={numImpute}
                  onChange={(e) => setNumImpute(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="median">Median (Default - Robust to Outliers)</option>
                  <option value="mean">Mean (Arithmetic Average)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Categorical Imputation
                </label>
                <select
                  value={catImpute}
                  onChange={(e) => setCatImpute(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="most_frequent">Most Frequent (Mode)</option>
                  <option value="constant">Constant ("Missing" token)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Train / Test Split Ratio
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="0.1"
                    max="0.4"
                    step="0.05"
                    value={testSize}
                    onChange={(e) => setTestSize(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-700 w-12 text-right">
                    {Math.round((1 - testSize) * 100)}:{Math.round(testSize * 100)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {Math.round((1 - testSize) * 100)}% Train / {Math.round(testSize * 100)}% Held-out Test
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Random State Seed
                </label>
                <input
                  type="number"
                  value={randomState}
                  onChange={(e) => setRandomState(parseInt(e.target.value) || 42)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-400">Fixed seed for exact reproducibility</span>
              </div>
            </div>

            {/* Hyperparameter Tuning Drawer */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Hyperparameter Optimization (GridSearchCV)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Performs k-fold cross-validation exclusively on the training split to find best parameters
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableTuning}
                    onChange={(e) => setEnableTuning(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              {enableTuning && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Cross-Validation Folds
                    </label>
                    <select
                      value={cvFolds}
                      onChange={(e) => setCvFolds(parseInt(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                    >
                      <option value="3">3-Fold Cross-Validation</option>
                      <option value="5">5-Fold Cross-Validation (Recommended)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Optimization Scoring Metric
                    </label>
                    <select
                      value={scoringMetric}
                      onChange={(e) => setScoringMetric(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                    >
                      {taskType === 'classification' ? (
                        <>
                          <option value="f1_weighted">F1-Score (Weighted) - Recommended for Imbalance</option>
                          <option value="accuracy">Accuracy</option>
                          <option value="precision_weighted">Precision (Weighted)</option>
                          <option value="recall_weighted">Recall (Weighted)</option>
                        </>
                      ) : (
                        <>
                          <option value="r2">R² (Coefficient of Determination)</option>
                          <option value="neg_mean_squared_error">Negative Mean Squared Error (MSE)</option>
                          <option value="neg_mean_absolute_error">Negative Mean Absolute Error (MAE)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={training || selectedFeatures.length === 0}
              className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md active:scale-98"
            >
              {training ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Fitting Pipeline & Evaluating...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Train & Evaluate Model</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
