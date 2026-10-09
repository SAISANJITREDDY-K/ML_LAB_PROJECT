export type TaskType = 'classification' | 'regression';

export interface DatasetMeta {
  id: string;
  filename: string;
  name: string;
  rows: number;
  columns: number;
  suggested_task: TaskType;
  suggested_target: string;
  exclude_columns: string[];
  created_at: string;
}

export interface DatasetSummary {
  id: string;
  filename: string;
  name: string;
  rows: number;
  columns: number;
  column_names: string[];
  data_types: Record<string, string>;
  duplicate_rows: number;
  numerical_column_count: number;
  categorical_column_count: number;
  numeric_columns: string[];
  categorical_columns: string[];
  missing_counts: Record<string, number>;
  missing_percentages: Record<string, number>;
  numeric_stats: Record<string, {
    count: number;
    mean: number;
    std: number;
    min: number;
    q25: number;
    median: number;
    q75: number;
    max: number;
  }>;
  categorical_stats: Record<string, {
    unique: number;
    top: string;
    top_freq: number;
    sample_values: Record<string, number>;
  }>;
  detected_features: {
    numeric: string[];
    categorical: string[];
    id_like: string[];
    constant: string[];
    high_cardinality: string[];
  };
  suggested_task: TaskType;
  suggested_target: string;
  exclude_columns: string[];
}

export interface DatasetPreview {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  columns: string[];
  records: Record<string, any>[];
}

export interface VisualizationsData {
  correlation: {
    columns: string[];
    matrix: number[][];
  };
  numeric_distributions: Record<string, {
    bins: { range: string; count: number }[];
    box: { min: number; q1: number; median: number; q3: number; max: number };
  }>;
  categorical_distributions: Record<string, { category: string; count: number }[]>;
  target_distribution?: {
    type: 'numeric' | 'categorical';
    distribution: any[];
  } | null;
}

export interface ClassificationMetrics {
  train_accuracy: number;
  test_accuracy: number;
  precision_macro: number;
  precision_weighted: number;
  recall_macro: number;
  recall_weighted: number;
  f1_macro: number;
  f1_weighted: number;
  roc_auc: number | null;
  roc_auc_status: string;
  classes: string[];
  confusion_matrix: number[][];
  per_class_metrics: Record<string, {
    precision: number;
    recall: number;
    f1_score: number;
    support: number;
  }>;
  binary_details?: {
    positive_class: string;
    negative_class: string;
    tp: number;
    tn: number;
    fp: number;
    fn: number;
  } | null;
  roc_curve: { fpr: number; tpr: number }[];
  prediction_time: number;
}

export interface RegressionMetrics {
  train_mae: number;
  test_mae: number;
  train_mse: number;
  test_mse: number;
  train_rmse: number;
  test_rmse: number;
  train_r2: number;
  test_r2: number;
  actual_vs_predicted: { actual: number; predicted: number }[];
  residual_points: { predicted: number; residual: number }[];
  residual_distribution: { bin: string; count: number }[];
  prediction_time: number;
}

export interface ModelMeta {
  model_id: string;
  name: string;
  dataset_id: string;
  dataset_name: string;
  task_type: TaskType;
  algorithm: string;
  algorithm_name: string;
  target_col: string;
  selected_features: string[];
  feature_count: number;
  test_size: number;
  random_state: number;
  num_impute: string;
  cat_impute: string;
  scale_numeric: boolean;
  enable_tuning: boolean;
  cv_folds: number;
  scoring_metric?: string;
  best_params: Record<string, any>;
  best_cv_score: number | null;
  cv_results_summary: {
    params: Record<string, any>;
    mean_score: number;
    std_score: number;
  }[];
  tuning_duration: number;
  training_duration: number;
  stratified_used: boolean;
  created_at: string;
  metrics: ClassificationMetrics & RegressionMetrics;
  schema: {
    selected_features: string[];
    numeric_features: string[];
    categorical_features: string[];
    feature_details: Record<string, any>;
  };
  warnings: string[];
}

export interface PredictionResult {
  index: number;
  prediction: string | number;
  probabilities?: Record<string, number>;
  confidence?: number | null;
  confidence_disclaimer?: string;
}
