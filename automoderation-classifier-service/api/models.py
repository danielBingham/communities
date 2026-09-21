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
"""Request and response bodies for the API.

These models are the contract with Communities.  Changing them is a breaking
change for the monolith, which will be calling this service on post and
comment creation.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ClassifyRequest(BaseModel):
    """Body of `POST /classify`."""

    model_config = ConfigDict(extra="forbid")

    content: str = Field(
        min_length=1,
        description="The text to classify.  A post body or a comment body.",
    )

    classifiers: list[str] | None = Field(
        default=None,
        min_length=1,
        description=(
            "Short names of the classifiers to run, e.g. ['nlp', 'llm'].  "
            "Omit the field entirely to use the service defaults.  An empty "
            "list is rejected -- 'run nothing' is never a sensible request, "
            "and accepting it would mean returning a score with nothing "
            "behind it.  Unknown names are rejected rather than skipped.  "
            "Names repeated in the list are run once."
        ),
    )


class ClassifyResponse(BaseModel):
    """Body returned by `POST /classify`.

    `score` is the weighted average across the classifiers that ran.  `1.0` is
    a clear policy violation, `0.0` is clearly non-violating, and values in
    between are the assembled probability that it violates.

    `classifiers` maps each classifier's name to its individual score, so the
    caller can see how the average was reached and log the breakdown.  A
    classifier that failed is absent from the map rather than reported as
    zero -- "did not run" and "found nothing" are different claims, and
    conflating them would understate the score.
    """

    model_config = ConfigDict(extra="forbid")

    score: float = Field(
        ge=0.0,
        le=1.0,
        description="Weighted average of the classifier scores.",
    )

    classifiers: dict[str, float] = Field(
        default_factory=dict,
        description="Each classifier's score, keyed by its short name.",
    )


class HealthResponse(BaseModel):
    """Body returned by `GET /health`."""

    model_config = ConfigDict(extra="forbid")

    status: str = Field(description="'ok' when the service can classify.")

    service: str = Field(description="The configured service name.")

    classifiers: list[str] = Field(
        default_factory=list,
        description="Every classifier a request may ask for.",
    )

    default_classifiers: list[str] = Field(
        default_factory=list,
        description="The classifiers used when a request names none.",
    )


class ErrorResponse(BaseModel):
    """Body returned for handled error conditions."""

    model_config = ConfigDict(extra="forbid")

    detail: str = Field(description="Human-readable description of the error.")
