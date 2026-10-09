# ModelForge AI

**An End-to-End Full-Stack Machine Learning Platform for Tabular Dataset Upload, Data Analysis, Model Training, Hyperparameter Tuning, Prediction, and Performance Evaluation.**

[![Python Tests](https://img.shields.io/badge/pytest-20%20passed-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/React-19.0-blue.svg)]()
[![Backend](https://img.shields.io/badge/Flask-3.1-black.svg)]()
[![ML Core](https://img.shields.io/badge/scikit--learn-1.9.1-orange.svg)]()

---

## 1. Abstract & Problem Statement

Modern machine learning courses and laboratory assignments frequently suffer from methodological lapses, most notably **data leakage**, in which testing data or global dataset distributions inadvertently contaminate preprocessing, normalization, or model selection. Furthermore, students and practitioners often lack an integrated full-stack interface that connects raw CSV data exploration, automated feature engineering, multi-model evaluation, and live inference without writing disjointed notebook scripts.

**ModelForge AI** bridges this gap. It is an end-to-end, full-stack machine learning workbench providing a modern responsive SaaS interface backed by a Python Flask REST API and scikit-learn ML core. It guarantees **100% data leakage prevention** by enforcing scikit-learn `Pipeline` and `ColumnTransformer` encapsulation within training folds.

---

## 2. Key Features

- **CSV Dataset Ingestion & Validation:** Drag-and-drop or file picker upload for tabular CSVs up to 16 MB with delimiter and encoding detection.
- **Exploratory Data Analysis (EDA):**
  - Interactive paginated data preview table.
  - Missing-value analysis with counts, percentages, and bar charts.
  - Duplicate row detection with one-click deduplication.
  - Descriptive statistics (mean, std, quartiles, median, min, max, mode, frequency counts).
  - Feature distributions and pairwise Pearson correlation heatmaps.
- **Model Training Studio:**
  - Automated target column suggestions and task classification (Classification vs. Regression).
  - Feature selection checklist with automated identifier exclusion.
  - Real-time data quality and leakage warnings.
  - 6 Classification algorithms: Logistic Regression, Decision Tree, Random Forest, KNN, Gaussian Naive Bayes, Support Vector Machine (SVC).
  - 5 Regression algorithms: Linear Regression, Polynomial Regression (degree 2), Decision Tree Regressor, Random Forest Regressor, Support Vector Regression (SVR).
- **Hyperparameter Tuning:**
  - `GridSearchCV` optimization executed strictly within training folds.
  - Configurable CV folds (3 or 5) and scoring metrics (Accuracy, F1-weighted, Precision, Recall, R², MSE, MAE).
  - Parameter search logging and best-trial ranking.
- **Evaluation & Diagnostics:**
  - Held-out test set metrics vs. training metrics.
  - Interactive Confusion Matrix heatmap with raw sample counts and percentages.
  - Interactive ROC curve plot with AUC score calculation.
  - Actual vs. Predicted parity scatter plot for regression ($y = \hat{y}$ reference line).
  - Residual error plots and error distribution histograms.
  - Class-wise performance reports (Precision, Recall, F1, Support).
- **Multi-Model Comparison Matrix:**
  - Sortable comparison table tracking test scores, CV scores, fit times, and latency.
  - Top-ranked model highlight.
- **Prediction Studio:**
  - Dynamic single-sample forms generated from the model's feature schema.
  - Batch CSV inference with instant tabular display and CSV export.
  - Class probability distribution breakdown and model confidence estimates.
- **Model Registry & Persistence:**
  - Serialized `.joblib` pipelines with structured metadata JSON.
  - Model inspection, reloading for inference, and safe deletion.

---

## 3. Technology Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide React icons, Native SVG data visualization components.
- **Backend Service:** Python 3.11, Flask 3.1, Flask-CORS, Werkzeug.
- **Machine Learning Core:** scikit-learn 1.9.1, pandas 3.0, NumPy 2.4, SciPy 1.17, joblib 1.6.
- **Application Server & Gateway:** Express 4.21, Node.js (`server.ts` with Vite middlewares and streaming reverse proxy).
- **Testing:** pytest 9.1 with automated test suite covering all 20 specification criteria.

---

## 4. Project Structure

```
ModelForge-AI/
├── backend/
│   ├── app.py                     # Flask application entry point & CORS
│   ├── config.py                  # Storage directories, ports, and limits
│   ├── requirements.txt           # Python dependency specifications
│   ├── api/
│   │   ├── datasets.py            # REST endpoints for CSV datasets
│   │   └── models.py              # REST endpoints for training & inference
│   ├── services/
│   │   ├── dataset_service.py     # EDA, summary, preview & cleaning
│   │   └── model_service.py       # Orchestrates training, persistence & prediction
│   ├── ml/
│   │   ├── preprocessing.py       # ColumnTransformer & leakage detection
│   │   ├── training.py            # Estimators & GridSearchCV tuning
│   │   ├── evaluation.py          # Metrics, confusion matrix, ROC & residuals
│   │   └── prediction.py          # Dynamic inference engine
│   └── tests/
│       └── test_backend.py        # 20 automated tests for full ML pipeline
├── datasets/
│   ├── custom_student_placement_classification.csv  # Benchmark classification dataset
│   └── custom_house_price_regression.csv            # Benchmark regression dataset
├── data/
│   ├── uploads/                   # Stored dataset files and metadata
│   └── models/                    # Persisted .joblib models and metadata
├── docs/
│   └── PROJECT_REPORT.md          # Comprehensive academic lab project report
├── scripts/
│   ├── generate_datasets.py       # Synthetic benchmark generator
│   └── verify_e2e_models.py       # Verification script for training benchmarks
├── src/
│   ├── App.tsx                    # Main React layout and tab router
│   ├── main.tsx                   # React root entry point
│   ├── types.ts                   # TypeScript interfaces
│   ├── index.css                  # Tailwind styles and typography
│   ├── services/
│   │   └── api.ts                 # Typed fetch client for backend REST API
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.tsx         # Top navigation bar
│   │   └── ui/
│   │       ├── MetricCard.tsx     # Metric card with tabular numbers
│   │       ├── DataTable.tsx      # Paginated dataset table
│   │       ├── ConfusionMatrix.tsx# Interactive confusion matrix heatmap
│   │       ├── RocCurve.tsx       # SVG ROC curve with AUC badge
│   │       ├── ScatterPlot.tsx    # Parity plot for regression
│   │       ├── ResidualPlot.tsx   # Residual error scatter and histogram
│   │       ├── CorrelationHeatmap.tsx # Pearson correlation heatmap
│   │       ├── BarChart.tsx       # Distribution bar chart
│   │       ├── UploadModal.tsx    # CSV drag-and-drop modal
│   │       └── LoadingSpinner.tsx # Asynchronous progress spinner
│   └── pages/
│       ├── DashboardPage.tsx      # System KPIs and workflow entry points
│       ├── DatasetExplorerPage.tsx# EDA, cleaning, and visualizations
│       ├── ModelTrainingPage.tsx  # Configuration, estimator and tuning
│       ├── ModelEvaluationPage.tsx# Held-out test evaluation diagnostics
│       ├── ModelComparisonPage.tsx# Multi-model comparison matrix
│       ├── PredictionsPage.tsx    # Single and batch inference studio
│       ├── SavedModelsPage.tsx    # Persisted model registry store
│       └── AboutPage.tsx          # Architecture & leakage prevention rules
├── server.ts                      # Full-stack gateway: Express + Vite + Flask proxy
├── package.json                   # Node scripts and dependencies
├── vite.config.ts                 # Vite bundler configuration
└── README.md                      # Complete system documentation
```

---

## 5. Quick Start Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ with `pip`

### Step 1: Install Dependencies
```bash
# Install Python backend dependencies
pip install -r backend/requirements.txt

# Install Node frontend dependencies
npm install
```

### Step 2: Run Automated Tests
Execute the 20-point automated test suite:
```bash
pytest backend/tests -v
```
*All 20 tests will pass in ~6 seconds.*

### Step 3: Start the Application
Run the unified full-stack server on port 3000:
```bash
npm run dev
```
*This command automatically spawns the Python Flask ML backend on port 5001, configures the reverse proxy, and boots the Vite dev server on `http://localhost:3000`.*

Open your browser at `http://localhost:3000`.

---

## 6. Workflow Walkthrough

### 1. Dataset Upload & Exploration
- Navigate to **Dataset Explorer** or click **Upload CSV**.
- Choose any valid tabular CSV or use the pre-loaded **Student Placement** or **House Price** benchmarks.
- View missing values, inspect descriptive statistics, review the Pearson correlation matrix, and click **Deduplicate** to eliminate any duplicate records before splitting.

### 2. Model Configuration & Training
- Navigate to **Model Training**.
- Choose your target variable (e.g., `Placement_Status` or `Price_Lakhs`).
- The application automatically recommends either **Classification** or **Regression**.
- Select your feature predictors. The system excludes obvious ID columns and prevents the target from being an input.
- Select your algorithm (e.g., Random Forest, Logistic Regression, SVR).
- (Optional) Toggle **Hyperparameter Optimization** to enable `GridSearchCV` on the training subset.
- Click **Train & Evaluate Model**.

### 3. Model Evaluation
- View held-out test set accuracy, F1-score, precision, recall, or R², RMSE, and MAE.
- Inspect the interactive **Confusion Matrix Heatmap** and **ROC Curve** for classification.
- Inspect the **Parity Plot** and **Residual Distribution** for regression.
- Review the hyperparameter tuning log to see the winning parameters.

### 4. Making Predictions
- Navigate to **Predictions**.
- In **Single Sample Form**, adjust the sliders/inputs generated for the model's features and click **Generate Prediction**.
- View predicted labels or numeric targets, probability breakdowns, and confidence indicators.
- In **Batch CSV Inference**, upload a multi-row CSV to generate predictions across all records and download the annotated CSV.

---

## 7. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check and ML runtime status |
| `GET` | `/api/stats` | System counts (datasets, models) |
| `GET` | `/api/datasets` | List indexed datasets |
| `POST`| `/api/datasets/upload` | Upload and validate new CSV dataset |
| `GET` | `/api/datasets/<id>/summary` | Complete descriptive statistics and quality metrics |
| `GET` | `/api/datasets/<id>/preview` | Paginated dataset records |
| `POST`| `/api/datasets/<id>/clean` | Remove duplicate rows from dataset |
| `GET` | `/api/datasets/<id>/visualizations` | Distributions and Pearson correlation matrix |
| `GET` | `/api/models` | List persisted models in registry |
| `POST`| `/api/models/train` | Execute leakage-proof training & evaluation |
| `GET` | `/api/models/<id>/details` | Detailed model metadata, metrics, and schema |
| `GET` | `/api/models/<id>/metrics` | Held-out test evaluation metrics |
| `POST`| `/api/models/<id>/predict` | Run inference on single sample or batch list |
| `DELETE`| `/api/models/<id>` | Remove model file from registry |

---

## 8. Data Leakage Prevention Guarantees

ModelForge AI strictly prevents data leakage through architectural constraints:
1. **Pre-split Isolation:** The dataset is split into training and testing partitions *prior* to fitting any imputer, scaler, or encoder.
2. **Pipeline Encapsulation:** All transformations reside in a `ColumnTransformer` inside a scikit-learn `Pipeline`.
3. **Cross-Validation Integrity:** During `GridSearchCV`, each fold fits its own preprocessing steps exclusively on its training split.
4. **Untouched Test Split:** The test set is evaluated exactly once after final pipeline fitting.
5. **No Target Contamination:** Target features are validated and strictly barred from input feature sets.

---

## 9. Verification & Test Results

```
============================== test session starts ==============================
collected 20 items

backend/tests/test_backend.py::test_1_health_endpoint PASSED             [  5%]
backend/tests/test_backend.py::test_2_valid_csv_upload PASSED            [ 10%]
backend/tests/test_backend.py::test_3_invalid_file_upload PASSED         [ 15%]
backend/tests/test_backend.py::test_4_empty_csv_handling PASSED          [ 20%]
backend/tests/test_backend.py::test_5_missing_value_summary PASSED       [ 25%]
backend/tests/test_backend.py::test_6_duplicate_detection_and_cleaning PASSED [ 30%]
backend/tests/test_backend.py::test_7_dataset_preview PASSED             [ 35%]
backend/tests/test_backend.py::test_8_target_column_validation PASSED    [ 40%]
backend/tests/test_backend.py::test_9_feature_selection_leakage_validation PASSED [ 45%]
backend/tests/test_backend.py::test_10_classification_training PASSED    [ 50%]
backend/tests/test_backend.py::test_11_regression_training PASSED        [ 55%]
backend/tests/test_backend.py::test_12_hyperparameter_tuning PASSED      [ 60%]
backend/tests/test_backend.py::test_13_prediction_using_trained_model PASSED [ 65%]
backend/tests/test_backend.py::test_14_model_persistence_and_loading PASSED [ 70%]
backend/tests/test_backend.py::test_15_evaluation_metrics_consistency PASSED [ 75%]
backend/tests/test_backend.py::test_16_categorical_encoding PASSED       [ 80%]
backend/tests/test_backend.py::test_17_missing_numeric_values_imputation PASSED [ 85%]
backend/tests/test_backend.py::test_18_unseen_categorical_values PASSED  [ 90%]
backend/tests/test_backend.py::test_19_invalid_prediction_inputs PASSED  [ 95%]
backend/tests/test_backend.py::test_20_data_leakage_prevention_structure PASSED [100%]

============================== 20 passed in 6.65s ==============================
```

---

## 10. License & Academic Attribution

Developed for university laboratory demonstrations and academic machine learning curricula. Built with scikit-learn, pandas, NumPy, Flask, and React.
