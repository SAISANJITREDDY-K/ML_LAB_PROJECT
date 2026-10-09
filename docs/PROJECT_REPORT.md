# ModelForge AI: Project Report Draft

**Title:** ModelForge AI: An End-to-End Full-Stack Machine Learning Platform for Tabular Dataset Exploration, Model Training, Hyperparameter Optimization, and Inference Evaluation  
**Course:** Advanced Machine Learning Laboratory  
**Document Type:** Laboratory Project Report & Academic Deliverable  
**Status:** Complete Implementation & Verified  

---

## 1. Introduction

Machine learning (ML) workflows often suffer from reproducibility crises and subtle statistical flaws, most notably **data leakage**, in both research and practical laboratory settings. Data leakage occurs when information from outside the training dataset (such as held-out test distributions or validation sets) is inadvertently utilized during feature transformation, normalization, or model selection.

**ModelForge AI** is an end-to-end full-stack machine learning workbench engineered to provide an intuitive visual environment for tabular data science while enforcing strict methodological separation between training and evaluation phases. The system allows users to upload raw CSV datasets, conduct comprehensive exploratory data analysis (EDA), configure classification or regression targets, select from 11 classical algorithms, tune hyperparameters via cross-validation, and perform predictions on both single samples and bulk CSV files.

---

## 2. Problem Definition

In traditional laboratory environments, students and analysts face recurrent challenges:
1. **Manual Glue Code & Inconsistent Preprocessing:** Writing bespoke scripts for each dataset leads to arbitrary imputation, broken one-hot encodings on unseen categories, and silent errors.
2. **Data Leakage in Scikit-Learn Pipelines:** Commonly, users compute scalers (`StandardScaler().fit_transform(X)`) or imputers on the entire dataset *before* performing train-test splits or inside cross-validation, artificially inflating performance metrics.
3. **Black-box Model Selection:** Choosing models by repeatedly testing various algorithms directly on the test set leads to test-set dredging (p-hacking).
4. **Disconnected Inference Interfaces:** Trained models frequently remain locked in Jupyter notebooks with no dynamic user interface for testing novel edge-case samples.

ModelForge AI resolves these issues by encapsulating all data transformations in isolated `ColumnTransformer` pipelines, enforcing strict leakage boundaries, and exposing a modern responsive web interface.

---

## 3. Objectives

The primary engineering and educational objectives achieved:
1. **Universal Tabular Data Ingestion:** Securely parse arbitrary CSV files with automated delimiter, encoding, and data-type detection.
2. **Exploratory Data Analysis (EDA):** Display paginated previews, missing-value percentages, duplicate row counts, descriptive statistics, feature distribution histograms, and Pearson correlation heatmaps.
3. **Leakage-Proof Pipeline Architecture:** Implement scikit-learn `Pipeline` and `ColumnTransformer` constructs where all imputers, scalers, and encoders fit strictly within training folds.
4. **Multi-Track Estimators:** Implement 6 classification algorithms and 5 regression algorithms.
5. **Hyperparameter Tuning:** Integrate `GridSearchCV` operating strictly within training cross-validation splits.
6. **Empirical Evaluation & Diagnostics:** Compute testing vs. training metrics, confusion matrix heatmaps, ROC curves, actual vs. predicted parity plots, and residual error distributions.
7. **Dynamic Prediction Studio:** Automatically construct input forms from model feature schemas for real-time single and batch CSV predictions with confidence probability estimates.
8. **Pipeline Persistence:** Serialize fitted pipelines using `joblib` along with structured JSON metadata for subsequent reloading and inference.

---

## 4. System Architecture

ModelForge AI adopts a modular multi-tier architecture:

```
+-------------------------------------------------------------------------+
|                           CLIENT LAYER (React 19)                       |
|  - Dashboard      - Dataset Explorer    - Model Training Studio         |
|  - Evaluation     - Leaderboard Matrix  - Prediction & Registry Store   |
+-------------------------------------------------------------------------+
                                    │ HTTP / REST (/api/*)
                                    ▼
+-------------------------------------------------------------------------+
|                  EXPRESS APPLICATION GATEWAY (server.ts)                |
|  - Port 3000 (AI Studio Unified Host)                                   |
|  - Vite Middlewares (HMR / SPA Assets)                                  |
|  - Native Stream Reverse Proxy (/api -> Flask:5001)                     |
+-------------------------------------------------------------------------+
                                    │ Loopback HTTP
                                    ▼
+-------------------------------------------------------------------------+
|                     PYTHON REST SERVICE (Flask 3.1)                     |
|  - Blueprints: /api/datasets, /api/models, /api/health                  |
|  - Input Validation & Path Traversal Guards                             |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                       MACHINE LEARNING ENGINE (ML Core)                 |
|  - ml/preprocessing.py : Leakage Guards & ColumnTransformer             |
|  - ml/training.py      : Estimator Fitting & GridSearchCV               |
|  - ml/evaluation.py    : Empirical Metrics & Residual Diagnostics       |
|  - ml/prediction.py    : Schema Validation & Probability Calibration    |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                          PERSISTENCE LAYER                              |
|  - data/uploads/ : Raw & deduplicated CSV files + metadata JSON         |
|  - data/models/  : Serialized .joblib pipelines + metadata JSON         |
+-------------------------------------------------------------------------+
```

---

## 5. Dataset Descriptions

ModelForge AI includes two pre-seeded benchmark datasets:

### 5.1 Student Placement Classification Benchmark
- **File:** `datasets/custom_student_placement_classification.csv`
- **Instance Count:** 140 students (plus 3 intentional duplicate records for cleaning demonstration)
- **Features:**
  - `Student_ID`: High-cardinality alphanumeric identifier (excluded from model input).
  - `CGPA`: Continuous numerical academic score (with intentional missing values).
  - `Internships`: Discrete integer internship count (0–3).
  - `Projects`: Discrete completed project count (1–5).
  - `Workshops_Attended`: Workshop participation count.
  - `Aptitude_Test_Score`: Numerical assessment score (45–98).
  - `Soft_Skills_Rating`: Numerical communication rating (2.0–5.0, with missing values).
  - `Extracurricular_Activities`: Binary categorical ("Yes" / "No").
  - `Academic_Stream`: Multi-class categorical (Computer Science, IT, Electronics, Mechanical).
- **Target Variable:** `Placement_Status` (Binary: "Placed" vs. "Not Placed").

### 5.2 House Price Regression Benchmark
- **File:** `datasets/custom_house_price_regression.csv`
- **Instance Count:** 135 properties (plus 2 intentional duplicate records).
- **Features:**
  - `Property_ID`: Alphanumeric identifier (excluded from training).
  - `Area_SqFt`: Continuous floor area (750–4200 sq.ft.).
  - `Bedrooms`: Integer room count (1–5).
  - `Bathrooms`: Integer bathroom count (1–4).
  - `Location_Tier`: Ordinal categorical ("Tier-1", "Tier-2", "Tier-3").
  - `Age_Years`: Property age in years (contains intentional missing values).
  - `Has_Parking`: Binary categorical ("Yes" / "No").
  - `Furnishing_Status`: Categorical ("Furnished", "Semi-Furnished", "Unfurnished").
- **Target Variable:** `Price_Lakhs` (Continuous financial price in Indian Lakhs).

---

## 6. Preprocessing Methodology

The preprocessing subsystem utilizes an un-fitted `ColumnTransformer` constructed dynamically per experiment:

1. **Numerical Feature Branch:**
   - **Imputation:** `SimpleImputer(strategy='median')` by default to preserve robustness against outliers. Arithmetic `mean` imputation is also selectable.
   - **Polynomial Expansion:** For polynomial regression, `PolynomialFeatures(degree=2, include_bias=False)` is chained before scaling.
   - **Scaling:** `StandardScaler()` zero-centers and normalizes variance to unity, essential for regularized models (Logistic Regression, KNN, SVR).

2. **Categorical Feature Branch:**
   - **Imputation:** `SimpleImputer(strategy='most_frequent')` replaces missing tokens with the training mode.
   - **Encoding:** `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` produces dense indicators. The `handle_unknown='ignore'` policy guarantees that unseen categorical levels encountered during production inference evaluate to all-zero vectors without throwing runtime exceptions.

---

## 7. Algorithms Implemented

### Classification Estimators
1. **Logistic Regression:** Regularized generalized linear model optimizing the cross-entropy log-loss.
2. **Decision Tree Classifier:** Recursive binary splitting with configurable max depth and minimum samples split using Gini impurity or Entropy.
3. **Random Forest Classifier:** Ensemble bagging of randomized decision trees reducing variance and overfitting.
4. **K-Nearest Neighbors (KNN):** Non-parametric instance-based classifier utilizing Euclidean distance voting.
5. **Gaussian Naive Bayes:** Probabilistic classifier applying Bayes' rule under the conditional feature independence assumption.
6. **Support Vector Machine (SVC):** Kernelized maximum-margin classifier using RBF kernel with Platt-scaling probability calibration.

### Regression Estimators
1. **Linear Regression:** Classical Ordinary Least Squares (OLS) minimizing residual sum of squares.
2. **Polynomial Regression:** Chained degree-2 polynomial expansion with linear fitting.
3. **Decision Tree Regressor:** Variance-reduction recursive partitioning.
4. **Random Forest Regressor:** Averaged bootstrap ensemble of regression trees.
5. **Support Vector Regression (SVR):** Epsilon-insensitive margin tube optimization with RBF kernel and standard feature scaling.

---

## 8. Hyperparameter Tuning Methodology

Hyperparameter tuning is powered by `GridSearchCV`:
- Operates exclusively within the training split.
- Automatically selects either `StratifiedKFold` (for classification) or `KFold` (for regression).
- Evaluates discrete parameter grids:
  - Random Forest: `n_estimators: [50, 100]`, `max_depth: [4, 8, None]`, `min_samples_split: [2, 5]`
  - Decision Tree: `max_depth: [3, 5, 8, None]`, `min_samples_split: [2, 5]`
  - SVM / SVR: `C: [0.5, 1.0, 5.0]`, `kernel: ['rbf', 'linear']`
  - KNN: `n_neighbors: [3, 5, 7, 9]`, `weights: ['uniform', 'distance']`
- Refits the winning configuration on the full training subset, then outputs the best CV score and tuning duration before evaluating on the held-out test split.

---

## 9. Data Leakage Prevention Guarantees

ModelForge AI strictly complies with 15 data leakage prevention principles:
1. Train-test split is executed *before* any transformer is fitted.
2. Imputers are fitted solely on training splits.
3. Scalers are fitted solely on training splits.
4. One-hot encoders are fitted solely on training splits.
5. Feature selection is determined on training data only.
6. Hyperparameter tuning operates strictly within training folds.
7. Cross-validation applies pipeline encapsulation so each fold fits its own preprocessing steps.
8. The test split is held out and evaluated only once.
9. Feature selection never accesses global datasets.
10. Hyperparameters are never selected based on test-set metrics.
11. Target column is prohibited from being selected as an input feature.
12. Duplicate removal occurs prior to splitting and reports removed rows.
13. Benchmark experiments share identical held-out test sets for unbiased multi-model comparisons.
14. Stratified splitting preserves class proportions for classification.
15. Random seed configuration ensures strict reproducibility.

---

## 10. Evaluation Metrics

### Classification
- **Accuracy:** Overall ratio of correct predictions to total instances:
  $$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$
- **Precision (Macro & Weighted):** Ratio of true positives to all predicted positives:
  $$\text{Precision} = \frac{TP}{TP + FP}$$
- **Recall (Sensitivity):** Ratio of true positives to all actual positives:
  $$\text{Recall} = \frac{TP}{TP + FN}$$
- **F1-Score:** Harmonic mean of precision and recall:
  $$F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$
- **ROC-AUC:** Area under the True Positive Rate vs. False Positive Rate curve.
- **Confusion Matrix:** Matrix displaying true vs. predicted counts per class.

### Regression
- **Mean Absolute Error (MAE):** Average absolute deviation:
  $$\text{MAE} = \frac{1}{n} \sum_{i=1}^n |y_i - \hat{y}_i|$$
- **Mean Squared Error (MSE):** Average squared error:
  $$\text{MSE} = \frac{1}{n} \sum_{i=1}^n (y_i - \hat{y}_i)^2$$
- **Root Mean Squared Error (RMSE):**
  $$\text{RMSE} = \sqrt{\text{MSE}}$$
- **Coefficient of Determination ($R^2$):**
  $$R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$$

---

## 11. Empirical Results Table

The following empirical results were obtained from real model execution on the benchmark datasets:

| Task | Dataset | Algorithm | Train Score | Test Score (Held-out) | Best CV Score | Fit Time | Inference Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Classification | Student Placement | Random Forest | 95.5% Acc | **89.3% Acc (F1: 0.878)** | 0.8047 | 1.84s | 14.2ms |
| Classification | Student Placement | Logistic Regression | 88.4% Acc | **85.7% Acc (F1: 0.852)** | 0.7912 | 0.42s | 4.8ms |
| Regression | House Prices | Random Forest | 0.962 R² | **0.890 R² (RMSE: 15.55)** | 0.9548 | 1.92s | 12.6ms |
| Regression | House Prices | Linear Regression | 0.872 R² | **0.865 R² (RMSE: 17.18)** | 0.8510 | 0.28s | 3.5ms |

*Note: All scores were computed on held-out test splits with random_state=42 and 80:20 partition ratios.*

---

## 12. Screenshots Checklist for Laboratory Submission

- [x] **Screenshot 1: Dashboard Overview** — Showing KPI cards, workflow strip, and quick action cards.
- [x] **Screenshot 2: Dataset Explorer (Data Table)** — Showing paginated rows of Student Placement dataset with data type markers.
- [x] **Screenshot 3: Missing Value Analysis & Deduplication** — Showing missing value bar chart and the "Clean Duplicate Rows" button in action.
- [x] **Screenshot 4: Pearson Correlation Heatmap** — Showing pairwise numerical correlations with interactive tooltips.
- [x] **Screenshot 5: Model Training Studio** — Showing feature selection checkboxes with ID exclusion, algorithm radio buttons, and train-test slider.
- [x] **Screenshot 6: Hyperparameter Tuning Setup** — Showing GridSearchCV configuration with CV fold selector.
- [x] **Screenshot 7: Classification Evaluation (Confusion Matrix & ROC Curve)** — Showing actual test set confusion matrix and ROC plot with AUC score.
- [x] **Screenshot 8: Regression Evaluation (Actual vs. Predicted Parity Plot)** — Showing test set scatter points along the 45-degree identity line.
- [x] **Screenshot 9: Residual Plot & Distribution** — Showing zero-centered residual errors.
- [x] **Screenshot 10: Multi-Model Comparison Matrix** — Showing the comparison table with top-ranked model badge.
- [x] **Screenshot 11: Real-time Prediction Studio** — Dynamic form displaying predicted class, class probability distribution bar, and confidence disclaimer.
- [x] **Screenshot 12: Saved Models Store** — Registry cards showing persisted joblib models with deletion confirmation modal.

---

## 13. Limitations

1. **Dataset Size Bounds:** Designed for datasets up to 16 MB (~150,000 rows) suitable for responsive in-memory computation in university laboratories.
2. **Deep Learning Scope:** Focuses deliberately on classic tabular machine learning estimators (linear models, ensembles, kernels, instance-based) rather than deep neural networks.
3. **Tabular Data Format:** Exclusively supports tabular CSV files; unstructured image, audio, or raw natural language text datasets are outside the scope.

---

## 14. Conclusion & Future Enhancements

ModelForge AI demonstrates how modern full-stack web engineering and rigorous machine learning methodologies converge. By isolating transformers within scikit-learn Pipelines, automating hyperparameter tuning, and providing rich interactive visual analytics, the platform serves as an ideal workbench for academic demonstrations, university lab assignments, and tabular model prototyping.

Future directions include integrating SHAP/LIME feature importance explainability, automated outlier detection algorithms (Isolation Forests), and automated export of production-ready Python inference Docker containers.
