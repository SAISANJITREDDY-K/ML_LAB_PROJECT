import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold, KFold
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC, SVR

from backend.ml.preprocessing import build_preprocessor


CLASSIFICATION_ALGORITHMS = {
    "logistic_regression": "Logistic Regression",
    "decision_tree": "Decision Tree Classifier",
    "random_forest": "Random Forest Classifier",
    "knn": "K-Nearest Neighbors Classifier",
    "naive_bayes": "Gaussian Naive Bayes",
    "svm": "Support Vector Machine (SVC)",
}

REGRESSION_ALGORITHMS = {
    "linear_regression": "Linear Regression",
    "polynomial_regression": "Polynomial Regression",
    "decision_tree": "Decision Tree Regressor",
    "random_forest": "Random Forest Regressor",
    "svr": "Support Vector Regression (SVR)",
}


def get_base_estimator(algorithm_key: str, task_type: str, random_state: int = 42, custom_params: dict = None):
    custom_params = custom_params or {}
    
    if task_type == "classification":
        if algorithm_key == "logistic_regression":
            params = {"max_iter": 1000, "random_state": random_state}
            params.update(custom_params)
            return LogisticRegression(**params)
        elif algorithm_key == "decision_tree":
            params = {"random_state": random_state, "max_depth": 5}
            params.update(custom_params)
            return DecisionTreeClassifier(**params)
        elif algorithm_key == "random_forest":
            params = {"n_estimators": 100, "random_state": random_state, "max_depth": 6}
            params.update(custom_params)
            return RandomForestClassifier(**params)
        elif algorithm_key == "knn":
            params = {"n_neighbors": 5}
            params.update(custom_params)
            return KNeighborsClassifier(**params)
        elif algorithm_key == "naive_bayes":
            params = {}
            params.update(custom_params)
            return GaussianNB(**params)
        elif algorithm_key == "svm":
            params = {"probability": True, "random_state": random_state}
            params.update(custom_params)
            return SVC(**params)
        else:
            raise ValueError(f"Unsupported classification algorithm: {algorithm_key}")

    elif task_type == "regression":
        if algorithm_key in ["linear_regression", "polynomial_regression"]:
            params = {}
            params.update(custom_params)
            return LinearRegression(**params)
        elif algorithm_key == "decision_tree":
            params = {"random_state": random_state, "max_depth": 5}
            params.update(custom_params)
            return DecisionTreeRegressor(**params)
        elif algorithm_key == "random_forest":
            params = {"n_estimators": 100, "random_state": random_state, "max_depth": 6}
            params.update(custom_params)
            return RandomForestRegressor(**params)
        elif algorithm_key == "svr":
            params = {"C": 1.0, "epsilon": 0.1}
            params.update(custom_params)
            return SVR(**params)
        else:
            raise ValueError(f"Unsupported regression algorithm: {algorithm_key}")

    else:
        raise ValueError(f"Unsupported task type: {task_type}")


def get_param_grid(algorithm_key: str, task_type: str) -> dict:
    """
    Returns concise, effective hyperparameter search grids for tuning.
    Grid sizes are optimized for responsive college lab execution.
    Prefixed with 'model__' for scikit-learn Pipeline compatibility.
    """
    if task_type == "classification":
        grids = {
            "logistic_regression": {
                "model__C": [0.1, 1.0, 10.0],
                "model__solver": ["lbfgs", "liblinear"],
            },
            "decision_tree": {
                "model__max_depth": [3, 5, 8, None],
                "model__min_samples_split": [2, 5],
                "model__criterion": ["gini", "entropy"],
            },
            "random_forest": {
                "model__n_estimators": [50, 100],
                "model__max_depth": [4, 8, None],
                "model__min_samples_split": [2, 5],
            },
            "knn": {
                "model__n_neighbors": [3, 5, 7, 9],
                "model__weights": ["uniform", "distance"],
            },
            "naive_bayes": {
                "model__var_smoothing": [1e-9, 1e-8, 1e-7],
            },
            "svm": {
                "model__C": [0.5, 1.0, 5.0],
                "model__kernel": ["rbf", "linear"],
            },
        }
        return grids.get(algorithm_key, {})

    elif task_type == "regression":
        grids = {
            "linear_regression": {
                "model__fit_intercept": [True, False],
            },
            "polynomial_regression": {
                "model__fit_intercept": [True, False],
            },
            "decision_tree": {
                "model__max_depth": [3, 5, 8, None],
                "model__min_samples_split": [2, 5],
            },
            "random_forest": {
                "model__n_estimators": [50, 100],
                "model__max_depth": [4, 8, None],
                "model__min_samples_split": [2, 5],
            },
            "svr": {
                "model__C": [0.5, 1.0, 10.0],
                "model__kernel": ["rbf", "linear"],
                "model__epsilon": [0.05, 0.1, 0.2],
            },
        }
        return grids.get(algorithm_key, {})

    return {}


def train_model(
    df: pd.DataFrame,
    target_col: str,
    selected_features: list[str],
    task_type: str,
    algorithm: str,
    test_size: float = 0.2,
    random_state: int = 42,
    num_impute: str = "median",
    cat_impute: str = "most_frequent",
    scale_numeric: bool = True,
    enable_tuning: bool = False,
    cv_folds: int = 5,
    scoring_metric: str = None,
    custom_hyperparameters: dict = None,
    polynomial_degree: int = 1,
):
    """
    Executes model training with strict data leakage prevention.
    Pipeline architecture:
    1. Clean missing target rows.
    2. Split train and test strictly BEFORE any transformer fitting.
    3. Build unfitted ColumnTransformer and Pipeline.
    4. If tuning is requested, perform GridSearchCV using ONLY training data.
    5. Fit the final pipeline on the training split.
    6. Predict and evaluate on held-out test split.
    """
    start_total_time = time.time()

    # Drop missing target rows
    df_clean = df.dropna(subset=[target_col]).copy()
    y = df_clean[target_col]
    X = df_clean[selected_features]

    # Partition feature types
    numeric_features = [c for c in selected_features if pd.api.types.is_numeric_dtype(X[c])]
    categorical_features = [c for c in selected_features if c not in numeric_features]

    # Stratified split check for classification
    stratify = None
    stratified_used = False
    if task_type == "classification":
        class_counts = y.value_counts()
        # Stratification requires each class to have at least 2 samples
        if class_counts.min() >= 2 and len(y) * test_size >= len(class_counts):
            stratify = y
            stratified_used = True

    # STEP 1: TRAIN-TEST SPLIT (LEAKAGE PREVENTION RULE 1)
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=stratify,
    )

    poly_deg = polynomial_degree if algorithm == "polynomial_regression" else 1

    # STEP 2: BUILD UNTRAINED PIPELINE (LEAKAGE PREVENTION RULE 2)
    preprocessor = build_preprocessor(
        numeric_features=numeric_features,
        categorical_features=categorical_features,
        num_impute_strategy=num_impute,
        cat_impute_strategy=cat_impute,
        scale_numeric=scale_numeric or (algorithm in ["logistic_regression", "knn", "svm", "svr"]),
        polynomial_degree=poly_deg,
    )

    estimator = get_base_estimator(
        algorithm_key=algorithm,
        task_type=task_type,
        random_state=random_state,
        custom_params=custom_hyperparameters,
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", estimator),
    ])

    best_params = {}
    best_cv_score = None
    cv_results_summary = []
    tuning_duration = 0.0

    # STEP 3: HYPERPARAMETER TUNING (IF ENABLED)
    if enable_tuning:
        param_grid = get_param_grid(algorithm, task_type)
        if param_grid:
            tune_start = time.time()
            effective_folds = max(2, min(cv_folds, len(X_train) // 4))

            cv_splitter = (
                StratifiedKFold(n_splits=effective_folds, shuffle=True, random_state=random_state)
                if task_type == "classification" and y_train.value_counts().min() >= effective_folds
                else KFold(n_splits=effective_folds, shuffle=True, random_state=random_state)
            )

            # Map user scoring metric to sklearn string
            scorer = scoring_metric
            if not scorer:
                scorer = "f1_weighted" if task_type == "classification" else "r2"

            grid_search = GridSearchCV(
                estimator=pipeline,
                param_grid=param_grid,
                cv=cv_splitter,
                scoring=scorer,
                n_jobs=-1,
                return_train_score=False,
            )

            # Fit GridSearch ONLY on training data!
            grid_search.fit(X_train, y_train)
            tuning_duration = round(time.time() - tune_start, 3)

            pipeline = grid_search.best_estimator_
            best_params = {k.replace("model__", ""): v for k, v in grid_search.best_params_.items()}
            best_cv_score = round(float(grid_search.best_score_), 4)

            # Collect top parameter trials
            for idx, p in enumerate(grid_search.cv_results_["params"]):
                cv_results_summary.append({
                    "params": {k.replace("model__", ""): v for k, v in p.items()},
                    "mean_score": round(float(grid_search.cv_results_["mean_test_score"][idx]), 4),
                    "std_score": round(float(grid_search.cv_results_["std_test_score"][idx]), 4),
                })
            cv_results_summary.sort(key=lambda x: x["mean_score"], reverse=True)
            cv_results_summary = cv_results_summary[:10]
        else:
            # Fit on training data directly
            fit_start = time.time()
            pipeline.fit(X_train, y_train)
            training_duration = round(time.time() - fit_start, 3)
    else:
        # Standard fit on training data directly
        fit_start = time.time()
        pipeline.fit(X_train, y_train)
        training_duration = round(time.time() - fit_start, 3)

    if not enable_tuning:
        training_duration = round(time.time() - start_total_time, 3)
    else:
        training_duration = tuning_duration

    # Extract default or tuned parameters from model step
    if not best_params:
        best_params = {
            k: v for k, v in pipeline.named_steps["model"].get_params().items()
            if k in ["C", "max_depth", "n_estimators", "n_neighbors", "kernel", "criterion", "solver", "epsilon"]
        }

    return {
        "pipeline": pipeline,
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "stratified_used": stratified_used,
        "best_params": best_params,
        "best_cv_score": best_cv_score,
        "cv_results_summary": cv_results_summary,
        "tuning_duration": tuning_duration,
        "training_duration": training_duration,
    }
