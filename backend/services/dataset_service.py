import json
import os
import shutil
import uuid
from pathlib import Path
import numpy as np
import pandas as pd

from backend.config import UPLOADS_DIR, SEED_DATASETS_DIR
from backend.ml.preprocessing import detect_feature_types

META_FILE = UPLOADS_DIR / "datasets_meta.json"


def _load_meta():
    if META_FILE.exists():
        try:
            with open(META_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def _save_meta(meta):
    with open(META_FILE, "w") as f:
        json.dump(meta, f, indent=2)


def seed_default_datasets():
    """
    Copies benchmark datasets into uploads directory if not already indexed.
    """
    meta = _load_meta()
    
    seeds = [
        {
            "id": "ds_student_placement",
            "filename": "custom_student_placement_classification.csv",
            "name": "Student Placement Benchmark",
            "suggested_task": "classification",
            "suggested_target": "Placement_Status",
            "exclude_columns": ["Student_ID"],
        },
        {
            "id": "ds_house_prices",
            "filename": "custom_house_price_regression.csv",
            "name": "House Price Benchmark",
            "suggested_task": "regression",
            "suggested_target": "Price_Lakhs",
            "exclude_columns": ["Property_ID"],
        },
    ]

    for seed in seeds:
        seed_path = SEED_DATASETS_DIR / seed["filename"]
        if seed_path.exists():
            dest_path = UPLOADS_DIR / f"{seed['id']}.csv"
            if not dest_path.exists():
                shutil.copy(seed_path, dest_path)

            if seed["id"] not in meta:
                try:
                    df = pd.read_csv(dest_path)
                    meta[seed["id"]] = {
                        "id": seed["id"],
                        "filename": seed["filename"],
                        "name": seed["name"],
                        "rows": len(df),
                        "columns": len(df.columns),
                        "suggested_task": seed["suggested_task"],
                        "suggested_target": seed["suggested_target"],
                        "exclude_columns": seed["exclude_columns"],
                        "created_at": "Benchmark Dataset",
                    }
                except Exception as e:
                    print(f"Failed to seed {seed['id']}: {e}")

    _save_meta(meta)


def get_dataset_path(dataset_id: str) -> Path:
    # Security: Prevent path traversal
    safe_id = Path(dataset_id).name
    path = UPLOADS_DIR / f"{safe_id}.csv"
    if not path.exists():
        raise FileNotFoundError(f"Dataset with ID '{dataset_id}' not found.")
    return path


def load_dataset_df(dataset_id: str) -> pd.DataFrame:
    path = get_dataset_path(dataset_id)
    # Handle encodings safely
    for enc in ["utf-8", "latin1", "cp1252"]:
        try:
            return pd.read_csv(path, encoding=enc)
        except UnicodeDecodeError:
            continue
    raise ValueError("Unable to decode CSV file with supported encodings (UTF-8, Latin1, CP1252).")


def list_datasets():
    seed_default_datasets()
    meta = _load_meta()
    return list(meta.values())


def save_uploaded_dataset(file_storage, filename: str) -> dict:
    if not filename.lower().endswith(".csv"):
        raise ValueError("Invalid file format. Only CSV (.csv) files are permitted.")

    dataset_id = f"ds_{uuid.uuid4().hex[:10]}"
    temp_path = UPLOADS_DIR / f"{dataset_id}.csv"

    file_storage.save(temp_path)

    # Validate CSV content
    try:
        for enc in ["utf-8", "latin1", "cp1252"]:
            try:
                df = pd.read_csv(temp_path, encoding=enc)
                break
            except UnicodeDecodeError:
                df = None

        if df is None:
            if temp_path.exists():
                temp_path.unlink()
            raise ValueError("CSV file encoding could not be resolved.")

    except Exception as e:
        if temp_path.exists():
            temp_path.unlink()
        raise ValueError(f"Malformed or invalid CSV file: {str(e)}")

    if df.empty or len(df) == 0:
        if temp_path.exists():
            temp_path.unlink()
        raise ValueError("Uploaded CSV dataset is completely empty.")

    if len(df.columns) < 2:
        if temp_path.exists():
            temp_path.unlink()
        raise ValueError("Dataset must have at least 2 columns (at least 1 feature and 1 target).")

    # Detect duplicate columns
    cols = [str(c).strip() for c in df.columns]
    if len(cols) != len(set(cols)):
        # Deduplicate column names
        seen = {}
        new_cols = []
        for c in cols:
            if c in seen:
                seen[c] += 1
                new_cols.append(f"{c}_{seen[c]}")
            else:
                seen[c] = 0
                new_cols.append(c)
        df.columns = new_cols
        df.to_csv(temp_path, index=False)

    # Detect suggestions
    detected = detect_feature_types(df)
    suggested_task = "classification"
    suggested_target = df.columns[-1]

    # Heuristic for target task
    last_col = df[suggested_target]
    if pd.api.types.is_numeric_dtype(last_col) and last_col.nunique() > 15:
        suggested_task = "regression"

    meta = _load_meta()
    meta[dataset_id] = {
        "id": dataset_id,
        "filename": filename,
        "name": filename.replace(".csv", "").replace("_", " ").title(),
        "rows": len(df),
        "columns": len(df.columns),
        "suggested_task": suggested_task,
        "suggested_target": suggested_target,
        "exclude_columns": detected["id_like"],
        "created_at": "User Upload",
    }
    _save_meta(meta)

    return meta[dataset_id]


def get_dataset_summary(dataset_id: str) -> dict:
    df = load_dataset_df(dataset_id)
    meta = _load_meta().get(dataset_id, {})

    total_rows = len(df)
    total_cols = len(df.columns)
    duplicate_rows = int(df.duplicated().sum())

    missing_counts = df.isna().sum().to_dict()
    missing_pct = {k: round(float((v / total_rows) * 100), 2) for k, v in missing_counts.items()}

    dtypes = {k: str(v) for k, v in df.dtypes.to_dict().items()}

    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    categorical_cols = [c for c in df.columns if c not in numeric_cols]

    # Detailed statistics
    numeric_stats = {}
    for col in numeric_cols:
        s = df[col].dropna()
        if len(s) > 0:
            numeric_stats[col] = {
                "count": int(s.count()),
                "mean": round(float(s.mean()), 3),
                "std": round(float(s.std()), 3) if len(s) > 1 else 0.0,
                "min": round(float(s.min()), 3),
                "q25": round(float(s.quantile(0.25)), 3),
                "median": round(float(s.median()), 3),
                "q75": round(float(s.quantile(0.75)), 3),
                "max": round(float(s.max()), 3),
            }

    categorical_stats = {}
    for col in categorical_cols:
        s = df[col].dropna()
        if len(s) > 0:
            vc = s.value_counts().head(5).to_dict()
            top_val = s.mode()[0] if not s.empty else "N/A"
            categorical_stats[col] = {
                "unique": int(s.nunique()),
                "top": str(top_val),
                "top_freq": int(s.value_counts().iloc[0]) if not s.empty else 0,
                "sample_values": {str(k): int(v) for k, v in vc.items()},
            }

    detected_features = detect_feature_types(df)

    return {
        "id": dataset_id,
        "filename": meta.get("filename", "dataset.csv"),
        "name": meta.get("name", "Dataset"),
        "rows": total_rows,
        "columns": total_cols,
        "column_names": list(df.columns),
        "data_types": dtypes,
        "duplicate_rows": duplicate_rows,
        "numerical_column_count": len(numeric_cols),
        "categorical_column_count": len(categorical_cols),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "missing_counts": {str(k): int(v) for k, v in missing_counts.items()},
        "missing_percentages": missing_pct,
        "numeric_stats": numeric_stats,
        "categorical_stats": categorical_stats,
        "detected_features": detected_features,
        "suggested_task": meta.get("suggested_task", "classification"),
        "suggested_target": meta.get("suggested_target", df.columns[-1]),
        "exclude_columns": meta.get("exclude_columns", detected_features["id_like"]),
    }


def get_dataset_preview(dataset_id: str, page: int = 1, page_size: int = 20) -> dict:
    df = load_dataset_df(dataset_id)
    total_records = len(df)
    total_pages = max(1, (total_records + page_size - 1) // page_size)
    page = max(1, min(page, total_pages))

    start_idx = (page - 1) * page_size
    end_idx = min(start_idx + page_size, total_records)

    slice_df = df.iloc[start_idx:end_idx].copy()
    # Replace NaNs with None for valid JSON serialization
    records = slice_df.replace({np.nan: None}).to_dict(orient="records")

    return {
        "page": page,
        "page_size": page_size,
        "total_records": total_records,
        "total_pages": total_pages,
        "columns": list(df.columns),
        "records": records,
    }


def remove_dataset_duplicates(dataset_id: str) -> dict:
    df = load_dataset_df(dataset_id)
    initial_rows = len(df)
    clean_df = df.drop_duplicates()
    removed_rows = initial_rows - len(clean_df)

    path = get_dataset_path(dataset_id)
    clean_df.to_csv(path, index=False)

    meta = _load_meta()
    if dataset_id in meta:
        meta[dataset_id]["rows"] = len(clean_df)
        _save_meta(meta)

    return {
        "dataset_id": dataset_id,
        "initial_rows": initial_rows,
        "remaining_rows": len(clean_df),
        "removed_rows": removed_rows,
    }


def get_dataset_visualizations(dataset_id: str, target_col: str = None) -> dict:
    df = load_dataset_df(dataset_id)
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    categorical_cols = [c for c in df.columns if c not in numeric_cols]

    # Correlation Matrix (handling constant & missing values)
    correlation_data = {"columns": [], "matrix": []}
    if len(numeric_cols) >= 2:
        valid_num_cols = [c for c in numeric_cols if df[c].std() > 0]
        if len(valid_num_cols) >= 2:
            corr_matrix = df[valid_num_cols].corr().fillna(0).round(3)
            correlation_data = {
                "columns": valid_num_cols,
                "matrix": corr_matrix.values.tolist(),
            }

    # Distribution histograms for up to 6 numeric features
    numeric_distributions = {}
    for col in numeric_cols[:8]:
        s = df[col].dropna()
        if len(s) > 0 and s.std() > 0:
            counts, edges = np.histogram(s, bins=10)
            numeric_distributions[col] = {
                "bins": [
                    {
                        "range": f"{round(float(edges[i]), 1)} - {round(float(edges[i+1]), 1)}",
                        "count": int(counts[i]),
                    }
                    for i in range(len(counts))
                ],
                "box": {
                    "min": round(float(s.min()), 2),
                    "q1": round(float(s.quantile(0.25)), 2),
                    "median": round(float(s.median()), 2),
                    "q3": round(float(s.quantile(0.75)), 2),
                    "max": round(float(s.max()), 2),
                },
            }

    # Categorical distributions for up to 6 categorical features
    categorical_distributions = {}
    for col in categorical_cols[:6]:
        s = df[col].dropna()
        if len(s) > 0:
            top_counts = s.value_counts().head(8).to_dict()
            categorical_distributions[col] = [
                {"category": str(k), "count": int(v)} for k, v in top_counts.items()
            ]

    # Target distribution
    target_dist = None
    if target_col and target_col in df.columns:
        t_series = df[target_col].dropna()
        if pd.api.types.is_numeric_dtype(t_series) and t_series.nunique() > 10:
            # Regression target
            counts, edges = np.histogram(t_series, bins=10)
            target_dist = {
                "type": "numeric",
                "distribution": [
                    {
                        "range": f"{round(float(edges[i]), 1)} - {round(float(edges[i+1]), 1)}",
                        "count": int(counts[i]),
                    }
                    for i in range(len(counts))
                ],
            }
        else:
            # Classification target
            val_counts = t_series.value_counts().to_dict()
            total_valid = len(t_series)
            target_dist = {
                "type": "categorical",
                "distribution": [
                    {
                        "class": str(k),
                        "count": int(v),
                        "percentage": round(float(v / total_valid) * 100, 2),
                    }
                    for k, v in val_counts.items()
                ],
            }

    return {
        "correlation": correlation_data,
        "numeric_distributions": numeric_distributions,
        "categorical_distributions": categorical_distributions,
        "target_distribution": target_dist,
    }
