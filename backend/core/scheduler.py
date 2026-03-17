"""
Model refresh scheduler.

Downloads both registered models from Azure ML on application startup (if not
already present) and re-downloads the latest versions on the 1st day of every
month at 06:00 UTC.
"""
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path

from .manager import ModelProvider

# Registered model names managed by this scheduler
MANAGED_MODELS: list[str] = [
    "azca-menus-model",
    "azca-services-model",
]


def _seconds_until_next_first_of_month_06utc() -> float:
    """Return the number of seconds until the next 1st-of-month at 06:00:00 UTC."""
    now = datetime.now(tz=timezone.utc)
    candidate = now.replace(day=1, hour=6, minute=0, second=0, microsecond=0)
    if candidate <= now:
        # This month's window has already passed — advance to next month
        if now.month == 12:
            candidate = candidate.replace(year=now.year + 1, month=1)
        else:
            candidate = candidate.replace(month=now.month + 1)
    return max((candidate - now).total_seconds(), 1.0)


async def _monthly_model_refresh_loop(
    provider: ModelProvider,
    model_names: list[str],
) -> None:
    """
    Background asyncio task.  Sleeps until the next 1st-of-month 06:00 UTC,
    re-downloads all listed models, then repeats indefinitely.
    """
    while True:
        wait_seconds = _seconds_until_next_first_of_month_06utc()
        next_run = datetime.now(tz=timezone.utc) + timedelta(seconds=wait_seconds)
        print(
            f"⏰ Model refresh scheduler: next run at "
            f"{next_run.strftime('%Y-%m-%d %H:%M:%S UTC')} "
            f"({wait_seconds / 3600:.1f} h from now)"
        )
        await asyncio.sleep(wait_seconds)
        print("🔄 Monthly model refresh triggered…")
        try:
            provider.ensure_models_in_artifacts(model_names, force=True)
            print("✅ Monthly model refresh complete.")
        except Exception as exc:
            print(f"❌ Monthly model refresh failed: {exc}")


def start_model_refresh_scheduler(
    provider: ModelProvider,
    model_names: list[str] | None = None,
) -> "asyncio.Task[None]":
    """
    Start the monthly model refresh background task and return it.
    Must be called from within a running asyncio event loop (e.g. FastAPI startup).
    """
    names = model_names if model_names is not None else MANAGED_MODELS
    task = asyncio.create_task(
        _monthly_model_refresh_loop(provider, names),
        name="monthly-model-refresh",
    )
    return task
