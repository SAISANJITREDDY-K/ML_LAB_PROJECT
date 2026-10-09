from datetime import datetime
import json
from pathlib import Path
import uuid
import joblib
import pandas as pd

from backend.config import MODELS_DIR
from backend.ml.preprocessing import validate_dataset_configuration
from backend.ml.training import (
    train_model,
    CLASSIFICATION_ALGORITHMS,
    REGRESSION_ALGORITHMS,
)
from backend.ml.evaluation import evaluate_classification, evaluate_regression
from backend.ml.prediction import predict_samples
from backend.services.dataset_service import load_dataset_df, _load_meta as load_dataset_meta


def _get_model_paths(model_id: str):
    safe_id = Path(model_id).name
    joblib_path = MODELS_DIR / f"{safe_id}.joblib"
    json_path = MODELS_DIR / f"{safe_id}.json"
    return joblib_path, json_path


def list_saved_models():
    models = []
    for meta_file in MODELS_DIR.glob("*.json"):
        try:
            with open(meta_file, "r") as f:
                data = json.load(f)
                models.append(data)
        except Exception:
            continue
    # Sort by created_at descending
    models.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return models


def get_model_details(model_id: str) -> dict:
    _, json_path = _get_model_paths(model_id)
    if not json_path.exists():
        raise FileNotFoundError(f"Model metadata '{model_id}' not found.")
    with open(json_path, "r") as f:
        return json.load(f)


def delete_saved_model(model_id: str) -> bool:
    joblib_path, json_path = _get_model_paths(model_id)
    deleted = False
    if joblib_path.exists():
        joblib_path.unlink()
        deleted = True
    if json_path.exists():
        json_path.unlink()
        deleted = True
    if not deleted:
        raise FileNotFoundError(f"Model '{model_id}' does not exist.")
    return True


def execute_training_pipeline(
    dataset_id: str,
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
) -> dict:
    df = load_dataset_df(dataset_id)
    ds_meta = load_dataset_meta().get(dataset_id, {})
    dataset_name = ds_meta.get("name", "Dataset")

    # 1. Validation and data leakage checks
    val_result = validate_dataset_configuration(
        df=df,
        target_col=target_col,
        selected_features=selected_features,
        task_type=task_type,
    )

    if not val_result["valid"]:
        raise ValueError("; ".join(val_result["errors"]))

    # 2. Train model with strict leakage-proof pipeline
    train_result = train_model(
        df=df,
        target_col=target_col,
        selected_features=selected_features,
        task_type=task_type,
        algorithm=algorithm,
        test_size=test_size,
        random_state=random_state,
        num_impute=num_impute,
        cat_impute=cat_impute,
        scale_numeric=scale_numeric,
        enable_tuning=enable_tuning,
        cv_folds=cv_folds,
        scoring_metric=scoring_metric,
        custom_hyperparameters=custom_hyperparameters,
        polynomial_degree=polynomial_degree,
    )

    pipeline = train_result["pipeline"]
    X_train = train_result["X_train"]
    X_test = train_result["X_test"]
    y_train = train_result["y_train"]
    y_test = train_result["y_test"]

    # 3. Evaluate on held-out test data
    if task_type == "classification":
        metrics = evaluate_classification(
            pipeline=pipeline,
            X_train=X_train,
            X_test=X_test,
            y_train=y_train,
            y_test=y_test,
        )
        algorithm_name = CLASSIFICATION_ALGORITHMS.get(algorithm, algorithm)
    else:
        metrics = evaluate_regression(
            pipeline=pipeline,
            X_train=X_train,
            X_test=X_test,
            y_train=y_train,
            y_test=y_test,
        )
        algorithm_name = REGRESSION_ALGORITHMS.get(algorithm, algorithm)

    model_id = f"mod_{uuid.uuid4().hex[:10]}"
    joblib_path, json_path = _get_model_paths(model_id)

    # 4. Save fitted pipeline using joblib
    joblib.dump(pipeline, joblib_path)

    # 5. Extract feature schema for dynamic predictions
    schema_info = {
        "selected_features": selected_features,
        "numeric_features": train_result["numeric_features"],
        "categorical_features": train_result["categorical_features"],
        "feature_details": {},
    }
    for col in selected_features:
        if col in train_result["numeric_features"]:
            s = df[col].dropna()
            schema_info["feature_details"][col] = {
                "type": "numeric",
                "min": round(float(s.min()), 2) if not s.empty else 0.0,
                "max": round(float(s.max()), 2) if not s.empty else 100.0,
                "median": round(float(s.median()), 2) if not s.empty else 50.0,
            }
        else:
            s = df[col].dropna()
            unique_vals = [str(x) for x in s.unique()[:25]]
            schema_info["feature_details"][col] = {
                "type": "categorical",
                "options": unique_vals,
                "default": unique_vals[0] if unique_vals else "Unknown",
            }

    model_meta = {
        "model_id": model_id,
        "name": f"{algorithm_name} - {dataset_name}",
        "dataset_id": dataset_id,
        "dataset_name": dataset_name,
        "task_type": task_type,
        "algorithm": algorithm,
        "algorithm_name": algorithm_name,
        "target_col": target_col,
        "selected_features": selected_features,
        "feature_count": len(selected_features),
        "test_size": test_size,
        "random_state": random_state,
        "num_impute": num_impute,
        "cat_impute": cat_impute,
        "scale_numeric": scale_numeric,
        "enable_tuning": enable_tuning,
        "cv_folds": cv_folds,
        "scoring_metric": scoring_metric,
        "best_params": train_result["best_params"],
        "best_cv_score": train_result["best_cv_score"],
        "cv_results_summary": train_result["cv_results_summary"],
        "tuning_duration": train_result["tuning_duration"],
        "training_duration": train_result["training_duration"],
        "stratified_used": train_result["stratified_used"],
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "metrics": metrics,
        "schema": schema_info,
        "warnings": val_result["warnings"],
    }

    with open(json_path, "w") as f:
        json.dump(model_meta, f, indent=2)

    return model_meta


def execute_prediction(model_id: str, samples: list[dict]) -> list[dict]:
    joblib_path, json_path = _get_model_paths(model_id)
    if not joblib_path.exists() or not json_path.exists():
        raise FileNotFoundError(f"Model '{model_id}' was not found.")

    with open(json_path, "r") as f:
        meta = json.load(f)

    # Security warning: load only local joblib model verified in MODELS_DIR
    pipeline = joblib.load(joblib_path)

    results = predict_samples(
        pipeline=pipeline,
        samples=samples,
        feature_schema=meta["schema"],
        task_type=meta["task_type"],
    )
    return results
