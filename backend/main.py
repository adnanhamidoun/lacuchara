"""ASGI entrypoint for running from backend folder with `uvicorn main:app`."""

from pathlib import Path
import sys

# Ensure package imports resolve as `backend.*` when launched from `backend/`.
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
	sys.path.insert(0, str(project_root))

from backend.api.main import app
