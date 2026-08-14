import sys

from loguru import logger

from .config import Settings


def configure_logging(settings: Settings) -> None:
    logger.remove()
    logger.add(
        sys.stderr,
        level=settings.log_level,
        serialize=settings.environment == "production",
        backtrace=False,
        diagnose=False,
        enqueue=False,
    )
