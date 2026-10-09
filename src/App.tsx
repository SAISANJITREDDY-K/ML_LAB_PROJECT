/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { UploadModal } from './components/ui/UploadModal';
import { DashboardPage } from './pages/DashboardPage';
import { DatasetExplorerPage } from './pages/DatasetExplorerPage';
import { ModelTrainingPage } from './pages/ModelTrainingPage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { SavedModelsPage } from './pages/SavedModelsPage';
import { AboutPage } from './pages/AboutPage';

import { DatasetMeta, ModelMeta } from './types';
import { fetchDatasets, fetchSavedModels } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Load initial datasets and saved models
  const refreshAppData = async () => {
    try {
      const [dsList, mdList] = await Promise.all([
        fetchDatasets(),
        fetchSavedModels(),
      ]);
      setDatasets(dsList);
      setModels(mdList);

      if (dsList.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(dsList[0].id);
      }
      if (mdList.length > 0 && !selectedModelId) {
        setSelectedModelId(mdList[0].model_id);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    refreshAppData();
  }, []);

  const handleUploadSuccess = (newDataset: DatasetMeta) => {
    setDatasets((prev) => [newDataset, ...prev]);
    setSelectedDatasetId(newDataset.id);
    setActiveTab('explorer');
  };

  const handleTrainingComplete = (newModel: ModelMeta) => {
    setModels((prev) => [newModel, ...prev]);
    setSelectedModelId(newModel.model_id);
    setActiveTab('evaluation');
  };

  const handleModelDeleted = (deletedModelId: string) => {
    setModels((prev) => prev.filter((m) => m.model_id !== deletedModelId));
    if (selectedModelId === deletedModelId) {
      const remaining = models.filter((m) => m.model_id !== deletedModelId);
      setSelectedModelId(remaining.length > 0 ? remaining[0].model_id : null);
    }
  };

  const handleNavigateWithContext = (
    tab: string,
    context?: { datasetId?: string; modelId?: string }
  ) => {
    if (context?.datasetId) {
      setSelectedDatasetId(context.datasetId);
    }
    if (context?.modelId) {
      setSelectedModelId(context.modelId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardPage
            datasets={datasets}
            models={models}
            onNavigate={handleNavigateWithContext}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {activeTab === 'explorer' && (
          <DatasetExplorerPage
            datasets={datasets}
            selectedDatasetId={selectedDatasetId}
            onSelectDatasetId={(id) => setSelectedDatasetId(id)}
            onOpenUpload={() => setIsUploadOpen(true)}
            onNavigateToTraining={(dsId) =>
              handleNavigateWithContext('training', { datasetId: dsId })
            }
          />
        )}

        {activeTab === 'training' && (
          <ModelTrainingPage
            datasets={datasets}
            initialDatasetId={selectedDatasetId}
            onTrainingComplete={handleTrainingComplete}
            onNavigateToExplorer={(dsId) =>
              handleNavigateWithContext('explorer', { datasetId: dsId })
            }
          />
        )}

        {activeTab === 'evaluation' && (
          <ModelEvaluationPage
            models={models}
            selectedModelId={selectedModelId}
            onSelectModelId={(id) => setSelectedModelId(id)}
            onNavigateToPredictions={(mId) =>
              handleNavigateWithContext('prediction', { modelId: mId })
            }
            onNavigateToTraining={() => setActiveTab('training')}
          />
        )}

        {activeTab === 'comparison' && (
          <ModelComparisonPage
            models={models}
            onSelectModel={(mId) =>
              handleNavigateWithContext('evaluation', { modelId: mId })
            }
            onNavigateToTraining={() => setActiveTab('training')}
          />
        )}

        {activeTab === 'prediction' && (
          <PredictionsPage
            models={models}
            selectedModelId={selectedModelId}
            onSelectModelId={(id) => setSelectedModelId(id)}
            onNavigateToTraining={() => setActiveTab('training')}
          />
        )}

        {activeTab === 'models' && (
          <SavedModelsPage
            models={models}
            onSelectForPrediction={(mId) =>
              handleNavigateWithContext('prediction', { modelId: mId })
            }
            onSelectForEvaluation={(mId) =>
              handleNavigateWithContext('evaluation', { modelId: mId })
            }
            onModelDeleted={handleModelDeleted}
            onNavigateToTraining={() => setActiveTab('training')}
          />
        )}

        {activeTab === 'about' && <AboutPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-800">ModelForge AI</span>
            <span className="mx-2">·</span>
            <span>Full-Stack Machine Learning Platform & Laboratory System</span>
          </div>
          <div className="flex items-center gap-4">
            <span>scikit-learn · pandas · NumPy · Flask · React</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-medium">100% Leakage-Protected</span>
          </div>
        </div>
      </footer>

      {/* CSV Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
