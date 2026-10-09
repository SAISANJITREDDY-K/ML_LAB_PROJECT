from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from backend.services.dataset_service import (
    list_datasets,
    save_uploaded_dataset,
    get_dataset_summary,
    get_dataset_preview,
    remove_dataset_duplicates,
    get_dataset_visualizations,
)

datasets_bp = Blueprint("datasets", __name__)


@datasets_bp.route("", methods=["GET"])
def get_all_datasets():
    try:
        datasets = list_datasets()
        return jsonify({"success": True, "datasets": datasets})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@datasets_bp.route("/upload", methods=["POST"])
def upload_dataset():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded in form data."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "No selected file."}), 400

    filename = secure_filename(file.filename)
    if not filename.lower().endswith(".csv"):
        return jsonify({"success": False, "error": "Invalid format. Only CSV files are permitted."}), 400

    try:
        meta = save_uploaded_dataset(file, filename)
        return jsonify({"success": True, "dataset": meta}), 201
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to process CSV: {str(e)}"}), 500


@datasets_bp.route("/<dataset_id>/summary", methods=["GET"])
def dataset_summary(dataset_id: str):
    try:
        summary = get_dataset_summary(dataset_id)
        return jsonify({"success": True, "summary": summary})
    except FileNotFoundError as fe:
        return jsonify({"success": False, "error": str(fe)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@datasets_bp.route("/<dataset_id>/preview", methods=["GET"])
def dataset_preview(dataset_id: str):
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 20, type=int)

    try:
        preview = get_dataset_preview(dataset_id, page=page, page_size=page_size)
        return jsonify({"success": True, "preview": preview})
    except FileNotFoundError as fe:
        return jsonify({"success": False, "error": str(fe)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@datasets_bp.route("/<dataset_id>/clean", methods=["POST"])
def clean_dataset(dataset_id: str):
    action = request.json.get("action", "remove_duplicates") if request.is_json else "remove_duplicates"
    if action != "remove_duplicates":
        return jsonify({"success": False, "error": f"Unknown cleaning action '{action}'"}), 400

    try:
        result = remove_dataset_duplicates(dataset_id)
        return jsonify({"success": True, "result": result})
    except FileNotFoundError as fe:
        return jsonify({"success": False, "error": str(fe)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@datasets_bp.route("/<dataset_id>/visualizations", methods=["GET"])
def dataset_visualizations(dataset_id: str):
    target_col = request.args.get("target_col", None)
    try:
        vis_data = get_dataset_visualizations(dataset_id, target_col=target_col)
        return jsonify({"success": True, "visualizations": vis_data})
    except FileNotFoundError as fe:
        return jsonify({"success": False, "error": str(fe)}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
