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
"""The service's HTTP routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request, status

from api.models import (
    ClassifyRequest,
    ClassifyResponse,
    ErrorResponse,
    HealthResponse,
)
from config.schema import Config
from services.classification import (
    DEFAULT_CLASSIFIERS,
    AllClassifiersFailedError,
    ClassificationService,
    UnknownClassifierError,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def get_config(request: Request) -> Config:
    """Pull the configuration off application state.

    Absent only if the app was built without running its lifespan, which is a
    wiring mistake rather than a request the caller got wrong -- hence a 500
    rather than a 4xx.
    """
    config: Config | None = getattr(request.app.state, "config", None)

    if config is None:
        raise RuntimeError(
            "Application state is missing its configuration.  The app was "
            "not started through its lifespan."
        )

    return config


def get_classification_service(request: Request) -> ClassificationService:
    """Pull the classification service off application state.

    Every classifier is built once during startup, not per request, so that
    classifiers can hold loaded models.
    """
    service: ClassificationService | None = getattr(
        request.app.state, "classification_service", None
    )

    if service is None:
        raise RuntimeError(
            "Application state is missing its classification service.  The "
            "app was not started through its lifespan."
        )

    return service


@router.post(
    "/classify",
    response_model=ClassifyResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify content for policy violation",
    responses={
        422: {
            "model": ErrorResponse,
            "description": (
                "Content was rejected, or an unknown classifier was named."
            ),
        },
        503: {
            "model": ErrorResponse,
            "description": "No classifier was able to score the content.",
        },
    },
)
async def classify(body: ClassifyRequest, request: Request) -> ClassifyResponse:
    """Score a piece of text against the requested classifiers.

    Name the classifiers to run in `classifiers`, or omit the field to use the
    service defaults.  Returns the weighted average of the classifiers that
    ran, along with each one's individual score.
    """
    config = get_config(request)
    service = get_classification_service(request)

    max_length = config.service.max_content_length

    if len(body.content) > max_length:
        # Truncating and scoring the remainder would report a score for
        # content we did not read, so refuse instead.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Content is {len(body.content)} characters, which exceeds the "
                f"{max_length} character limit."
            ),
        )

    try:
        outcome = await service.classify(body.content, body.classifiers)
    except UnknownClassifierError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        ) from error
    except AllClassifiersFailedError as error:
        # Log with the traceback: this is the one case where we return no
        # score at all, so whoever is paged wants to see why.
        logger.exception("Classification failed entirely.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "No classifier was able to score this content.  The content "
                "has not been classified -- do not treat this as a pass."
            ),
        ) from error

    if outcome.failures:
        logger.warning(
            "Classified with %d of %d classifiers.  Failed: %s",
            len(outcome.scores),
            len(outcome.scores) + len(outcome.failures),
            ", ".join(sorted(outcome.failures)),
        )

    return ClassifyResponse(score=outcome.score, classifiers=outcome.scores)


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Liveness and readiness check",
)
async def health(request: Request) -> HealthResponse:
    """Report that the service is up and which classifiers it can run."""
    config = get_config(request)
    service = get_classification_service(request)

    return HealthResponse(
        status="ok",
        service=config.service.name,
        classifiers=service.available,
        default_classifiers=list(DEFAULT_CLASSIFIERS),
    )
