import sys
from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.config import HOST, PORT, MAX_CONTENT_LENGTH
from backend.api.datasets import datasets_bp
from backend.api.models import models_bp
from backend.services.dataset_service import list_datasets, seed_default_datasets
from backend.services.model_service import list_saved_models

def create_app():
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

    # Enable CORS for all routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Seed default benchmark datasets on startup
    try:
        seed_default_datasets()
    except Exception as e:
        print(f"Warning: default dataset seeding encountered: {e}")

    # Register blueprints
    app.register_blueprint(datasets_bp, url_prefix="/api/datasets")
    app.register_blueprint(models_bp, url_prefix="/api/models")

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "ModelForge AI Backend",
            "version": "1.0.0",
            "python_ml": "scikit-learn, pandas, numpy active",
        })

    @app.route("/api/stats", methods=["GET"])
    def system_stats():
        datasets = list_datasets()
        models = list_saved_models()
        total_predictions = 0
        return jsonify({
            "success": True,
            "total_datasets": len(datasets),
            "total_models": len(models),
            "recent_datasets": datasets[:5],
            "recent_models": models[:5],
        })

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @app.errorhandler(413)
    def handle_large_file(e):
        return jsonify({"success": False, "error": "File size exceeds the 16MB limit."}), 413

    @app.errorhandler(500)
    def handle_server_error(e):
        return jsonify({"success": False, "error": "Internal server error occurred."}), 500

    return app


app = create_app()

if __name__ == "__main__":
    print(f"Starting ModelForge AI Flask Backend on http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=False)
