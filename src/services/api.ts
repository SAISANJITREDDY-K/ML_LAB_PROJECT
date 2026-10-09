import {
  DatasetMeta,
  DatasetSummary,
  DatasetPreview,
  VisualizationsData,
  ModelMeta,
  PredictionResult,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchStats(): Promise<{
  total_datasets: number;
  total_models: number;
  recent_datasets: DatasetMeta[];
  recent_models: ModelMeta[];
}> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch system stats');
  return res.json();
}

export async function fetchDatasets(): Promise<DatasetMeta[]> {
  const res = await fetch(`${API_BASE}/datasets`);
  if (!res.ok) throw new Error('Failed to fetch datasets list');
  const data = await res.json();
  return data.datasets || [];
}

export async function uploadDataset(file: File): Promise<DatasetMeta> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/datasets/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to upload dataset');
  }
  return data.dataset;
}

export async function fetchDatasetSummary(datasetId: string): Promise<DatasetSummary> {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/summary`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load dataset summary');
  }
  return data.summary;
}

export async function fetchDatasetPreview(
  datasetId: string,
  page = 1,
  pageSize = 20
): Promise<DatasetPreview> {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/preview?page=${page}&pageSize=${pageSize}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load dataset preview');
  }
  return data.preview;
}

export async function cleanDatasetDuplicates(
  datasetId: string
): Promise<{ initial_rows: number; remaining_rows: number; removed_rows: number }> {
  const res = await fetch(`${API_BASE}/datasets/${datasetId}/clean`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'remove_duplicates' }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to clean dataset duplicates');
  }
  return data.result;
}

export async function fetchDatasetVisualizations(
  datasetId: string,
  targetCol?: string
): Promise<VisualizationsData> {
  const url = targetCol
    ? `${API_BASE}/datasets/${datasetId}/visualizations?target_col=${encodeURIComponent(targetCol)}`
    : `${API_BASE}/datasets/${datasetId}/visualizations`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load visualizations');
  }
  return data.visualizations;
}

export interface TrainConfigPayload {
  dataset_id: string;
  target_col: string;
  selected_features: string[];
  task_type: string;
  algorithm: string;
  test_size?: number;
  random_state?: number;
  num_impute?: string;
  cat_impute?: string;
  scale_numeric?: boolean;
  enable_tuning?: boolean;
  cv_folds?: number;
  scoring_metric?: string;
  polynomial_degree?: number;
}

export async function trainModel(payload: TrainConfigPayload): Promise<ModelMeta> {
  const res = await fetch(`${API_BASE}/models/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to train model');
  }
  return data.model;
}

export async function fetchSavedModels(): Promise<ModelMeta[]> {
  const res = await fetch(`${API_BASE}/models`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch saved models');
  }
  return data.models || [];
}

export async function fetchModelDetails(modelId: string): Promise<ModelMeta> {
  const res = await fetch(`${API_BASE}/models/${modelId}/details`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch model details');
  }
  return data.model;
}

export async function deleteModel(modelId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/models/${modelId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete model');
  }
}

export async function runPrediction(
  modelId: string,
  samples: Record<string, any>[]
): Promise<PredictionResult[]> {
  const res = await fetch(`${API_BASE}/models/${modelId}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ samples }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Prediction failed');
  }
  return data.predictions || [];
}
