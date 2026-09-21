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
"""The shape of the configuration file.

Modelled with Pydantic so that a malformed configuration fails at startup with
a precise error rather than at the first request with an AttributeError.

Configuration covers how the service runs -- where it binds, how it logs, what
it will accept.  It deliberately does not cover which classifiers exist or run;
that is the registry in `services.classification` and the `classifiers` field
on the request.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_LOG_LEVELS = frozenset(
    {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
)


class ServiceConfig(BaseModel):
    """Service-level settings."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(default="automoderation-classifier-service")

    host: str = Field(
        default="0.0.0.0",
        description="Interface uvicorn binds to.",
    )

    port: int = Field(
        default=8081,
        ge=1,
        le=65535,
        description="Port uvicorn binds to.",
    )

    log_level: str = Field(
        default="INFO",
        description="Root log level: DEBUG, INFO, WARNING, ERROR, CRITICAL.",
    )

    max_content_length: int = Field(
        default=10000,
        ge=1,
        description=(
            "Longest content the endpoint accepts, in characters.  Defaults "
            "to 10000 to match the post body limit in "
            "packages/shared/validation/entities/Post.js.  Content longer "
            "than this is rejected with a 422."
        ),
    )

    @field_validator("log_level")
    @classmethod
    def log_level_must_be_valid(cls, value: str) -> str:
        normalized = value.strip().upper()

        if normalized not in VALID_LOG_LEVELS:
            raise ValueError(
                f"Invalid log_level '{value}'.  Must be one of "
                f"{', '.join(sorted(VALID_LOG_LEVELS))}."
            )

        return normalized


class Config(BaseModel):
    """The whole configuration file."""

    model_config = ConfigDict(extra="forbid")

    service: ServiceConfig = Field(default_factory=ServiceConfig)
