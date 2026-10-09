import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
MODELS_DIR = DATA_DIR / "models"
SEED_DATASETS_DIR = BASE_DIR / "datasets"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
SEED_DATASETS_DIR.mkdir(parents=True, exist_ok=True)

MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max CSV size
ALLOWED_EXTENSIONS = {".csv"}
DEFAULT_RANDOM_STATE = 42
PORT = int(os.environ.get("FLASK_PORT", 5001))
HOST = os.environ.get("FLASK_HOST", "127.0.0.1")
