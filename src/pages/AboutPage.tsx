import React from 'react';
import {
  BrainCircuit,
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  CheckCircle2,
  BookOpen,
  Code2,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title & Abstract */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              ModelForge AI
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              An End-to-End Full-Stack Machine Learning Laboratory Platform
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-4">
          ModelForge AI is a complete academic and enterprise-grade full-stack machine learning workbench
          designed for automated dataset upload, exploratory data analysis, data leakage prevention,
          multi-algorithm training, hyperparameter optimization, model evaluation, and real-time prediction.
          Every metric and prediction displayed is computed from real model execution using scikit-learn,
          pandas, and NumPy.
        </p>
      </div>

      {/* 15 Data Leakage Prevention Principles */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            The 15 Data Leakage Prevention Rules Enforced in ModelForge AI
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Strict methodological integrity is built directly into every stage of the pipeline architecture:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {[
            'Split train and test sets strictly before fitting any preprocessing transformation.',
            'Fit missing-value imputers (median/mean/mode) exclusively on training data.',
            'Fit feature standardizers (StandardScaler) exclusively on training data.',
            'Fit categorical one-hot encoders exclusively on training data with handle_unknown="ignore".',
            'Conduct feature selection using training data only.',
            'Execute hyperparameter optimization (GridSearchCV) using training folds only.',
            'Fit all cross-validation preprocessing separately within each CV fold using sklearn Pipelines.',
            'Keep held-out test splits completely untouched until final evaluation.',
            'Never select features using the global or full dataset.',
            'Never tune hyperparameters based on held-out test set performance.',
            'Strictly prohibit the target column from being included in model input features.',
            'Perform any dataset duplicate removal prior to splitting and report removed rows.',
            'Preserve an identical held-out test set for fair model comparisons within an experiment.',
            'Apply stratified splitting for classification when minority class counts support it.',
            'Enforce random seed reproducibility across all stochastic models and splits.',
          ].map((rule, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-700"
            >
              <span className="font-mono font-bold text-indigo-600 shrink-0 tabular-nums">
                {(idx + 1).toString().padStart(2, '0')}.
              </span>
              <span className="leading-relaxed">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-600" />
          <span>Technology Architecture</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 text-indigo-600">
              Frontend Client
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>· React 19 SPA with Vite</li>
              <li>· Tailwind CSS v4 styling</li>
              <li>· Lucide React icons</li>
              <li>· Interactive SVG analytics</li>
              <li>· Tabular numerals (<code className="font-mono text-[11px]">tabular-nums</code>)</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 text-indigo-600">
              Backend & Server
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>· Python 3 & Flask REST API</li>
              <li>· Flask-CORS for secure headers</li>
              <li>· Express Node server (<code className="font-mono text-[11px]">server.ts</code>)</li>
              <li>· Native streaming proxy to Flask</li>
              <li>· Pytest automated test harness</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 text-indigo-600">
              Machine Learning Core
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>· scikit-learn Pipeline architecture</li>
              <li>· ColumnTransformer preprocessing</li>
              <li>· pandas DataFrame manipulation</li>
              <li>· NumPy mathematical operations</li>
              <li>· joblib pipeline serialization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Supported Algorithms Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <span>Implemented Machine Learning Algorithms</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block mb-3">
              Classification Estimators (6)
            </h3>
            <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside">
              <li><strong>Logistic Regression:</strong> Linear decision boundary with L2 regularization</li>
              <li><strong>Decision Tree Classifier:</strong> Recursive binary partitioning with Gini/Entropy</li>
              <li><strong>Random Forest Classifier:</strong> Ensemble bagging of randomized decision trees</li>
              <li><strong>K-Nearest Neighbors:</strong> Instance-based spatial Euclidean voting</li>
              <li><strong>Gaussian Naive Bayes:</strong> Probabilistic Bayes theorem with Gaussian priors</li>
              <li><strong>Support Vector Machine (SVC):</strong> RBF margin optimization with probability calibration</li>
            </ol>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block mb-3">
              Regression Estimators (5)
            </h3>
            <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside">
              <li><strong>Linear Regression:</strong> Ordinary Least Squares continuous parameter estimation</li>
              <li><strong>Polynomial Regression:</strong> Degree-2 feature interaction expansion with linear fitting</li>
              <li><strong>Decision Tree Regressor:</strong> Variance-reduction tree splits</li>
              <li><strong>Random Forest Regressor:</strong> Bagged ensemble of regression trees</li>
              <li><strong>Support Vector Regression (SVR):</strong> Epsilon-insensitive margin tube with RBF kernel</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
