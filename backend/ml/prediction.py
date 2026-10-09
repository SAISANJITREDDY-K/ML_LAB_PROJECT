import numpy as np
import pandas as pd


def predict_samples(
    pipeline,
    samples: list[dict],
    feature_schema: dict,
    task_type: str,
):
    """
    Runs prediction through the exact saved pipeline.
    Validates input feature presence and types against saved schema.
    """
    if not samples or len(samples) == 0:
        raise ValueError("At least one sample must be provided for prediction.")

    df_input = pd.DataFrame(samples)

    # Validate required features
    required_features = feature_schema.get("selected_features", [])
    missing_cols = [col for col in required_features if col not in df_input.columns]
    if missing_cols:
        raise ValueError(f"Input is missing required features: {missing_cols}")

    # Ensure correct column ordering and subset
    df_clean = df_input[required_features].copy()

    # Cast numeric columns where possible
    numeric_features = feature_schema.get("numeric_features", [])
    for col in numeric_features:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce")

    # Run predictions
    raw_preds = pipeline.predict(df_clean)

    results = []
    has_proba = hasattr(pipeline, "predict_proba") and task_type == "classification"
    probabilities = None

    if has_proba:
        try:
            probabilities = pipeline.predict_proba(df_clean)
        except Exception:
            has_proba = False

    classes = list(getattr(pipeline, "classes_", []))

    for idx, pred in enumerate(raw_preds):
        item = {
            "index": idx,
            "prediction": str(pred) if task_type == "classification" else round(float(pred), 4),
        }

        if has_proba and probabilities is not None:
            sample_probs = probabilities[idx]
            prob_dict = {
                str(classes[c_idx]): round(float(sample_probs[c_idx]), 4)
                for c_idx in range(len(classes))
            }
            max_prob = float(np.max(sample_probs))
            item["probabilities"] = prob_dict
            item["confidence"] = round(max_prob * 100, 2)
            item["confidence_disclaimer"] = "Confidence reflects model probability estimates on training distributions, not guaranteed ground truth."
        elif task_type == "classification":
            item["confidence"] = None
            item["confidence_disclaimer"] = "Selected model does not compute probability distributions."
        else:
            item["confidence"] = None
            item["confidence_disclaimer"] = "Continuous regression estimate."

        results.append(item)

    return results
