###############################################################################
#
#  Communities -- Non-profit, cooperative social media
#  Copyright (C) 2022 - 2026 Daniel Bingham
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU Affero General Public License as published
#  by the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU Affero General Public License for more details.
#
#  You should have received a copy of the GNU Affero General Public License
#  along with this program.  If not, see <https://www.gnu.org/licenses/>.
#
###############################################################################
"""Entry point for the automoderation classifier service.

Loads the configuration, loads every registered classifier, and serves them
behind FastAPI.

Run it with uvicorn:

    uvicorn main:app --reload --port 8081

or directly, which reads the host and port out of the configuration:

    python main.py
"""

from __future__ import annotations

import logging
import os
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from api.routes import router
from config import Config, load_config
from services.classification import ClassificationService

logger = logging.getLogger(__name__)

LOG_FORMAT = "%(asctime)s %(levelname)-8s %(name)s: %(message)s"


def configure_logging(level: str) -> None:
    """Set up root logging.

    Plain text to stdout, which is what the rest of the local stack does and
    what Docker expects.  If this service ever ships to Kubernetes alongside
    the Node services, this is where structured JSON logging goes.
    """
    logging.basicConfig(
        level=level.upper(),
        format=LOG_FORMAT,
        stream=sys.stdout,
        force=True,
    )


def create_app(config: Config | None = None) -> FastAPI:
    """Build the FastAPI application.

    Args:
        config: A configuration to use instead of loading one from disk.
            Tests pass one in; the running service does not.

    Returns:
        A configured `FastAPI` app.  Classifiers are loaded during startup
        rather than here, so that importing this module does not read files or
        load models.
    """

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        """Load configuration and classifiers at startup, release at shutdown.

        A failure in here stops the service from coming up.  That is the
        intent: a classifier service that boots without its classifiers would
        answer requests with scores that mean nothing.
        """
        app_config = config if config is not None else load_config()

        configure_logging(app_config.service.log_level)

        service = ClassificationService.load()
        await service.setup()

        app.state.config = app_config
        app.state.classification_service = service

        logger.info(
            "%s ready with %d classifier(s): %s",
            app_config.service.name,
            len(service.classifiers),
            ", ".join(service.available),
        )

        try:
            yield
        finally:
            await service.teardown()
            logger.info("%s shut down.", app_config.service.name)

    app = FastAPI(
        title="Communities Automoderation Classifier Service",
        description=(
            "Classifies text content against the Communities content "
            "policies and Terms of Service, returning the probability that "
            "it violates them."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    app.include_router(router)

    return app


app = create_app()


def main() -> None:
    """Run the service under uvicorn, bound per the configuration."""
    import uvicorn

    # Loaded here only to find the host and port to bind.  The app loads its
    # own copy during startup, so that a reload picks up config changes.
    startup_config = load_config()

    configure_logging(startup_config.service.log_level)

    uvicorn.run(
        "main:app",
        host=startup_config.service.host,
        port=startup_config.service.port,
        reload=os.environ.get("RELOAD", "false").lower() == "true",
        log_level=startup_config.service.log_level.lower(),
    )


if __name__ == "__main__":
    main()
