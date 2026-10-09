import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, PolynomialFeatures


def detect_feature_types(df: pd.DataFrame, target_col: str = None):
    """
    Inspects DataFrame columns and classifies them into:
    numeric, categorical, high_cardinality, constant, and id_like columns.
    """
    numeric_cols = []
    categorical_cols = []
    id_like_cols = []
    constant_cols = []
    high_cardinality_cols = []

    total_rows = len(df)

    for col in df.columns:
        if col == target_col:
            continue

        series = df[col].dropna()
        n_unique = series.nunique()

        # Constant check
        if n_unique <= 1:
            constant_cols.append(col)
            continue

        # ID-like check (e.g. ID in column name or 100% unique strings/integers in large dataset)
        col_lower = col.lower()
        is_id_name = any(k in col_lower for k in ["id", "uuid", "identifier", "key", "index"])
        if (is_id_name and n_unique >= total_rows * 0.8) or (n_unique == total_rows and total_rows > 30):
            id_like_cols.append(col)
            continue

        # Numeric check
        if pd.api.types.is_numeric_dtype(df[col]):
            numeric_cols.append(col)
        else:
            if n_unique > 50 and n_unique > total_rows * 0.5:
                high_cardinality_cols.append(col)
            categorical_cols.append(col)

    return {
        "numeric": numeric_cols,
        "categorical": categorical_cols,
        "id_like": id_like_cols,
        "constant": constant_cols,
        "high_cardinality": high_cardinality_cols,
    }


def validate_dataset_configuration(
    df: pd.DataFrame,
    target_col: str,
    selected_features: list[str],
    task_type: str,
):
    """
    Validates user configuration and returns structured warnings and errors.
    Enforces strict data leakage prevention rules.
    """
    errors = []
    warnings = []

    if not target_col:
        errors.append("Target column must be selected.")
        return {"valid": False, "errors": errors, "warnings": warnings}

    if target_col not in df.columns:
        errors.append(f"Target column '{target_col}' not found in dataset.")
        return {"valid": False, "errors": errors, "warnings": warnings}

    if not selected_features or len(selected_features) == 0:
        errors.append("At least one input feature must be selected.")
        return {"valid": False, "errors": errors, "warnings": warnings}

    # CRITICAL LEAKAGE CHECK: Target must never be in features
    if target_col in selected_features:
        errors.append(
            f"Target leakage detected: '{target_col}' cannot be included in input features."
        )

    for feat in selected_features:
        if feat not in df.columns:
            errors.append(f"Selected feature '{feat}' does not exist in dataset.")

    if errors:
        return {"valid": False, "errors": errors, "warnings": warnings}

    # Target missing check
    target_series = df[target_col]
    target_missing = int(target_series.isna().sum())
    if target_missing > 0:
        warnings.append(
            f"Target column '{target_col}' contains {target_missing} missing value(s). Rows with missing targets will be dropped before training."
        )

    clean_target = target_series.dropna()
    total_clean_rows = len(clean_target)
    if total_clean_rows < 10:
        errors.append(f"Dataset has only {total_clean_rows} valid target rows, which is too small for training.")
        return {"valid": False, "errors": errors, "warnings": warnings}

    # Task type and cardinality check
    n_unique_target = clean_target.nunique()
    if task_type == "classification":
        if n_unique_target < 2:
            errors.append("Classification requires at least 2 distinct target classes.")
        elif n_unique_target > 20:
            warnings.append(
                f"Target has {n_unique_target} unique classes. Multi-class classification with high class count may require substantial training samples."
            )

        class_counts = clean_target.value_counts()
        min_class_count = int(class_counts.min())
        if min_class_count < 2:
            warnings.append(
                f"Class '{class_counts.idxmin()}' has only {min_class_count} sample(s). Stratified train-test split requires at least 2 samples per class."
            )
        # Class imbalance warning
        max_class_count = int(class_counts.max())
        if max_class_count / max(min_class_count, 1) > 4.0:
            warnings.append(
                f"Severe class imbalance observed: class '{class_counts.idxmax()}' ({max_class_count}) vs '{class_counts.idxmin()}' ({min_class_count})."
            )

    elif task_type == "regression":
        if not pd.api.types.is_numeric_dtype(clean_target):
            errors.append(
                f"Regression target '{target_col}' must be numeric, but has data type '{clean_target.dtype}'."
            )
        elif n_unique_target <= 5:
            warnings.append(
                f"Target '{target_col}' has only {n_unique_target} unique values. Consider whether this is a classification task."
            )

    # Feature inspection warnings
    detected = detect_feature_types(df, target_col=target_col)
    for feat in selected_features:
        if feat in detected["id_like"]:
            warnings.append(
                f"Feature '{feat}' appears to be an identifier (high cardinality/index-like). Training on IDs often causes overfitting and poor generalization."
            )
        if feat in detected["constant"]:
            warnings.append(
                f"Feature '{feat}' has zero variance (constant values across all rows) and carries no predictive signal."
            )
        if feat in detected["high_cardinality"]:
            warnings.append(
                f"Feature '{feat}' has very high categorical cardinality ({df[feat].nunique()} unique values)."
            )

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }


def build_preprocessor(
    numeric_features: list[str],
    categorical_features: list[str],
    num_impute_strategy: str = "median",
    cat_impute_strategy: str = "most_frequent",
    scale_numeric: bool = True,
    polynomial_degree: int = 1,
) -> ColumnTransformer:
    """
    Builds a robust, unfitted scikit-learn ColumnTransformer.
    Leakage prevention:
    This transformer contains ONLY definitions and will ONLY be fitted inside
    training data or within each cross-validation fold.
    """
    transformers = []

    if numeric_features:
        num_steps = [
            ("imputer", SimpleImputer(strategy=num_impute_strategy)),
        ]
        if polynomial_degree > 1 and len(numeric_features) <= 10:
            num_steps.append(
                ("poly", PolynomialFeatures(degree=polynomial_degree, include_bias=False))
            )
        if scale_numeric:
            num_steps.append(("scaler", StandardScaler()))

        num_pipeline = Pipeline(steps=num_steps)
        transformers.append(("num", num_pipeline, numeric_features))

    if categorical_features:
        cat_steps = [
            (
                "imputer",
                SimpleImputer(strategy=cat_impute_strategy, fill_value="missing"),
            ),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            ),
        ]
        cat_pipeline = Pipeline(steps=cat_steps)
        transformers.append(("cat", cat_pipeline, categorical_features))

    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder="drop",
        verbose_feature_names_out=False,
    )
    return preprocessor
