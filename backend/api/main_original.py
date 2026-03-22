"""Deprecated compatibility shim.

Use backend.api.main as the canonical API module.
This file is intentionally minimal to avoid divergence.
"""

from .main import *  # noqa: F401,F403
