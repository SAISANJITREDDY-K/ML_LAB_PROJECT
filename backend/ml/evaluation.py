import time
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    classification_report,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


def evaluate_classification(
    pipeline,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
    positive_class: str = None,
):
    pred_start = time.time()
    y_test_pred = pipeline.predict(X_test)
    prediction_time = round(time.time() - pred_start, 4)

    y_train_pred = pipeline.predict(X_train)

    # Convert to string for consistent labels
    y_train_str = y_train.astype(str)
    y_test_str = y_test.astype(str)
    y_train_pred_str = pd.Series(y_train_pred).astype(str)
    y_test_pred_str = pd.Series(y_test_pred).astype(str)

    classes = sorted(list(np.unique(np.concatenate([y_train_str.values, y_test_str.values]))))
    is_binary = len(classes) == 2

    # Accuracy
    train_acc = round(float(accuracy_score(y_train_str, y_train_pred_str)), 4)
    test_acc = round(float(accuracy_score(y_test_str, y_test_pred_str)), 4)

    # Precision, Recall, F1
    prec_macro = round(float(precision_score(y_test_str, y_test_pred_str, average="macro", zero_division=0)), 4)
    prec_weighted = round(float(precision_score(y_test_str, y_test_pred_str, average="weighted", zero_division=0)), 4)
    rec_macro = round(float(recall_score(y_test_str, y_test_pred_str, average="macro", zero_division=0)), 4)
    rec_weighted = round(float(recall_score(y_test_str, y_test_pred_str, average="weighted", zero_division=0)), 4)
    f1_macro = round(float(f1_score(y_test_str, y_test_pred_str, average="macro", zero_division=0)), 4)
    f1_weighted = round(float(f1_score(y_test_str, y_test_pred_str, average="weighted", zero_division=0)), 4)

    # Confusion matrix
    cm = confusion_matrix(y_test_str, y_test_pred_str, labels=classes)
    cm_list = cm.tolist()

    # Binary specifics
    binary_details = None
    if is_binary:
        pos_label = positive_class if (positive_class in classes) else classes[1]
        neg_label = classes[0] if classes[1] == pos_label else classes[1]

        # TP, TN, FP, FN based on positive class
        # Positive class matches pos_label
        tp = int(np.sum((y_test_str == pos_label) & (y_test_pred_str.values == pos_label)))
        tn = int(np.sum((y_test_str == neg_label) & (y_test_pred_str.values == neg_label)))
        fp = int(np.sum((y_test_str == neg_label) & (y_test_pred_str.values == pos_label)))
        fn = int(np.sum((y_test_str == pos_label) & (y_test_pred_str.values == neg_label)))

        binary_details = {
            "positive_class": pos_label,
            "negative_class": neg_label,
            "tp": tp,
            "tn": tn,
            "fp": fp,
            "fn": fn,
        }

    # Classification report breakdown
    report_dict = classification_report(y_test_str, y_test_pred_str, output_dict=True, zero_division=0)
    per_class_metrics = {}
    for cls in classes:
        if cls in report_dict:
            per_class_metrics[cls] = {
                "precision": round(float(report_dict[cls]["precision"]), 4),
                "recall": round(float(report_dict[cls]["recall"]), 4),
                "f1_score": round(float(report_dict[cls]["f1-score"]), 4),
                "support": int(report_dict[cls]["support"]),
            }

    # ROC-AUC and ROC Curve
    roc_auc_val = None
    roc_auc_status = "computed"
    roc_curve_data = []

    # Check if pipeline supports predict_proba or decision_function
    has_proba = hasattr(pipeline, "predict_proba")
    has_decision = hasattr(pipeline, "decision_function")

    test_classes_present = np.unique(y_test_str)
    if len(test_classes_present) < 2:
        roc_auc_status = "Not available: Test set contains only 1 class."
    elif not (has_proba or has_decision):
        roc_auc_status = "Not available: Model does not support probability estimation."
    else:
        try:
            if has_proba:
                probs = pipeline.predict_proba(X_test)
                # Map model classes
                model_classes = list(pipeline.classes_)
                if is_binary:
                    pos_idx = 1
                    if positive_class and positive_class in model_classes:
                        pos_idx = list(model_classes).index(positive_class)

                    pos_probs = probs[:, pos_idx]
                    pos_label = model_classes[pos_idx]
                    y_test_binary = (y_test_str == str(pos_label)).astype(int)

                    roc_auc_val = round(float(roc_auc_score(y_test_binary, pos_probs)), 4)
                    fpr, tpr, thresholds = roc_curve(y_test_binary, pos_probs)
                    # Sample curve points to avoid huge payload
                    step = max(1, len(fpr) // 50)
                    for i in range(0, len(fpr), step):
                        roc_curve_data.append({"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)})
                    if roc_curve_data[-1]["fpr"] != 1.0:
                        roc_curve_data.append({"fpr": 1.0, "tpr": 1.0})
                else:
                    # Multiclass OvR
                    roc_auc_val = round(float(roc_auc_score(y_test_str, probs, multi_class="ovr")), 4)
            elif has_decision:
                scores = pipeline.decision_function(X_test)
                if is_binary:
                    pos_label = classes[1]
                    y_test_binary = (y_test_str == pos_label).astype(int)
                    roc_auc_val = round(float(roc_auc_score(y_test_binary, scores)), 4)
                    fpr, tpr, _ = roc_curve(y_test_binary, scores)
                    step = max(1, len(fpr) // 50)
                    for i in range(0, len(fpr), step):
                        roc_curve_data.append({"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)})
                    if roc_curve_data[-1]["fpr"] != 1.0:
                        roc_curve_data.append({"fpr": 1.0, "tpr": 1.0})
        except Exception as e:
            roc_auc_status = f"Not available: {str(e)}"

    return {
        "train_accuracy": train_acc,
        "test_accuracy": test_acc,
        "precision_macro": prec_macro,
        "precision_weighted": prec_weighted,
        "recall_macro": rec_macro,
        "recall_weighted": rec_weighted,
        "f1_macro": f1_macro,
        "f1_weighted": f1_weighted,
        "roc_auc": roc_auc_val,
        "roc_auc_status": roc_auc_status,
        "classes": classes,
        "confusion_matrix": cm_list,
        "per_class_metrics": per_class_metrics,
        "binary_details": binary_details,
        "roc_curve": roc_curve_data,
        "prediction_time": prediction_time,
    }


def evaluate_regression(
    pipeline,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
):
    pred_start = time.time()
    y_test_pred = pipeline.predict(X_test)
    prediction_time = round(time.time() - pred_start, 4)

    y_train_pred = pipeline.predict(X_train)

    # Convert to pure float arrays
    y_train_arr = np.array(y_train, dtype=float)
    y_train_pred_arr = np.array(y_train_pred, dtype=float)
    y_test_arr = np.array(y_test, dtype=float)
    y_test_pred_arr = np.array(y_test_pred, dtype=float)

    # MAE
    train_mae = round(float(mean_absolute_error(y_train_arr, y_train_pred_arr)), 4)
    test_mae = round(float(mean_absolute_error(y_test_arr, y_test_pred_arr)), 4)

    # MSE
    train_mse = round(float(mean_squared_error(y_train_arr, y_train_pred_arr)), 4)
    test_mse = round(float(mean_squared_error(y_test_arr, y_test_pred_arr)), 4)

    # RMSE = sqrt(MSE)
    train_rmse = round(float(np.sqrt(train_mse)), 4)
    test_rmse = round(float(np.sqrt(test_mse)), 4)

    # R2
    train_r2 = round(float(r2_score(y_train_arr, y_train_pred_arr)), 4)
    test_r2 = round(float(r2_score(y_test_arr, y_test_pred_arr)), 4)

    # Actual vs Predicted points (sample if large)
    n_pts = len(y_test_arr)
    sample_indices = np.random.choice(n_pts, size=min(n_pts, 80), replace=False) if n_pts > 80 else np.arange(n_pts)
    
    actual_vs_predicted = [
        {"actual": round(float(y_test_arr[i]), 3), "predicted": round(float(y_test_pred_arr[i]), 3)}
        for i in sample_indices
    ]

    # Residuals: actual - predicted
    residuals = y_test_arr - y_test_pred_arr
    residual_points = [
        {"predicted": round(float(y_test_pred_arr[i]), 3), "residual": round(float(residuals[i]), 3)}
        for i in sample_indices
    ]

    # Residual histogram distribution
    hist_counts, bin_edges = np.histogram(residuals, bins=10)
    residual_hist = [
        {
            "bin": f"{round(float(bin_edges[i]), 2)} to {round(float(bin_edges[i+1]), 2)}",
            "count": int(hist_counts[i]),
        }
        for i in range(len(hist_counts))
    ]

    return {
        "train_mae": train_mae,
        "test_mae": test_mae,
        "train_mse": train_mse,
        "test_mse": test_mse,
        "train_rmse": train_rmse,
        "test_rmse": test_rmse,
        "train_r2": train_r2,
        "test_r2": test_r2,
        "actual_vs_predicted": actual_vs_predicted,
        "residual_points": residual_points,
        "residual_distribution": residual_hist,
        "prediction_time": prediction_time,
    }
