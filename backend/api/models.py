from flask import Blueprint, request, jsonify

from backend.services.model_service import (
    execute_training_pipeline,
    list_saved_models,
    get_model_details,
    delete_saved_model,
    execute_prediction,
)

models_bp = Blueprint("models", __name__)


@models_bp.route("", methods=["GET"])
def get_all_models():
    try:
        models = list_saved_models()
        return jsonify({"success": True, "models": models})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@models_bp.route("/train", methods=["POST"])
def train():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Request body must be valid JSON."}), 400

    required_keys = ["dataset_id", "target_col", "selected_features", "task_type", "algorithm"]
    missing = [k for k in required_keys if k not in data]
    if missing:
        return jsonify({"success": False, "error": f"Missing required parameters: {', '.join(missing)}"}), 400

    try:
        result = execute_training_pipeline(
            dataset_id=data["dataset_id"],
            target_col=data["target_col"],
            selected_features=data["selected_features"],
            task_type=data["task_type"],
            algorithm=data["algorithm"],
            test_size=float(data.get("test_size", 0.2)),
            random_state=int(data.get("random_state", 42)),
            num_impute=data.get("num_impute", "median"),
            cat_impute=data.get("cat_impute", "most_frequent"),
            scale_numeric=bool(data.get("scale_numeric", True)),
            enable_tuning=bool(data.get("enable_tuning", False)),
            cv_folds=int(data.get("cv_folds", 5)),
            scoring_metric=data.get("scoring_metric"),
            custom_hyperparameters=data.get("custom_hyperparameters"),
            polynomial_degree=int(data.get("polynomial_degree", 2)),
        )
        return jsonify({"success": True, "model": result}), 201
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except FileNotFoundError as fe:
        return jsonify({"success": False, "error": str(fe)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": f"Model training failed: {str(e)}"}), 500


@models_bp.route("/<model_id>/details", methods=["GET"])
def model_details(model_id: str):
    try:
        meta = get_model_details(model_id)
        return jsonify({"success": True, "model": meta})
    except FileNotFoundError as fe:
        return jsonify({"success": False, "error": str(fe)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@models_bp.route("/<model_id>/metrics", methods=["GET"])
def model_metrics(model_id: str):
    try:
        meta = get_model_details(model_id)
        return jsonify({"success": True, "metrics": meta.get("metrics", {})})
    except FileNotFoundError as fe:
        return jsonify({"success": False, "error": str(fe)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@models_bp.route("/<model_id>/predict", methods=["POST"])
def predict(model_id: str):
    data = request.get_json()
    if not data or "samples" not in data:
        return jsonify({"success": False, "error": "Request body must contain 'samples' list."}), 400

    samples = data["samples"]
    if not isinstance(samples, list) or len(samples) == 0:
        return jsonify({"success": False, "error": "'samples' must be a non-empty list of objects."}), 400

    try:
        predictions = execute_prediction(model_id, samples)
        return jsonify({"success": True, "predictions": predictions})
    except FileNotFoundError as fe:
        return jsonify({"success": False, "error": str(fe)}), 404
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Prediction failed: {str(e)}"}), 500


@models_bp.route("/<model_id>", methods=["DELETE"])
def delete_model(model_id: str):
    try:
        delete_saved_model(model_id)
        return jsonify({"success": True, "message": f"Model '{model_id}' deleted."})
    except FileNotFoundError as fe:
        return jsonify({"success": False, "error": str(fe)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
