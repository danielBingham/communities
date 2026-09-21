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
"""Configuration loading.

The service is configured by a YAML file -- `config/config.yaml` by default --
covering how it runs: where it binds, how it logs, what it will accept.  A
handful of environment variables override those settings so the container can
be pointed around without editing the file:

    AUTOMODERATION_CONFIG_PATH  Path to the configuration file.
    HOST                        Overrides service.host.
    PORT                        Overrides service.port.
    LOG_LEVEL                   Overrides service.log_level.

Which classifiers exist is not configuration.  They are registered in
`services.classification.CLASSIFIERS`, loaded in full at startup, and selected
per request by the `classifiers` field on the request body.

Unlike the Node services, this one does not read from AWS Parameter Store.  It
holds no secrets and needs no credentials, which is deliberate -- it is meant
to stay decoupled from Communities proper.  When it eventually needs S3 access
for image and video moderation, that is the point at which to revisit this and
match the `aws-ssm-parameter:` convention the rest of the stack uses.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

import yaml
from pydantic import ValidationError

from config.schema import Config, ServiceConfig

logger = logging.getLogger(__name__)

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent / "config.yaml"

CONFIG_PATH_ENV_VAR = "AUTOMODERATION_CONFIG_PATH"


class ConfigurationError(Exception):
    """Raised when the configuration is missing, unreadable, or invalid."""


def resolve_config_path(path: str | Path | None = None) -> Path:
    """Work out which configuration file to load.

    Precedence: the explicit `path` argument, then `AUTOMODERATION_CONFIG_PATH`,
    then the default `config/config.yaml`.
    """
    if path is not None:
        return Path(path).expanduser().resolve()

    from_env = os.environ.get(CONFIG_PATH_ENV_VAR)
    if from_env:
        return Path(from_env).expanduser().resolve()

    return DEFAULT_CONFIG_PATH


def load_config(path: str | Path | None = None) -> Config:
    """Read, parse, validate, and env-override the configuration file.

    Args:
        path: Explicit path to a configuration file.  Falls back to the
            environment variable and then the packaged default.

    Returns:
        A validated `Config`.

    Raises:
        ConfigurationError: If the file is missing, is not valid YAML, is not
            a mapping, or does not satisfy the schema.
    """
    config_path = resolve_config_path(path)

    if not config_path.is_file():
        raise ConfigurationError(
            f"Configuration file not found at '{config_path}'.  Set "
            f"{CONFIG_PATH_ENV_VAR} to point at one, or create the default "
            f"at '{DEFAULT_CONFIG_PATH}'."
        )

    try:
        parsed: Any = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    except yaml.YAMLError as error:
        raise ConfigurationError(
            f"Could not parse '{config_path}' as YAML: {error}"
        ) from error
    except OSError as error:
        raise ConfigurationError(
            f"Could not read '{config_path}': {error}"
        ) from error

    if parsed is None:
        parsed = {}

    if not isinstance(parsed, dict):
        raise ConfigurationError(
            f"Configuration at '{config_path}' must be a mapping at the top "
            f"level, got {type(parsed).__name__}."
        )

    raw: dict[str, Any] = {str(key): value for key, value in parsed.items()}

    try:
        config = Config(**raw)
    except ValidationError as error:
        raise ConfigurationError(
            f"Invalid configuration at '{config_path}':\n{error}"
        ) from error

    config = _apply_environment_overrides(config)

    logger.info("Loaded configuration from '%s'.", config_path)

    return config


def _apply_environment_overrides(config: Config) -> Config:
    """Let the environment override service-level settings.

    Container orchestration sets environment variables; it does not edit files
    baked into images.
    """
    service: dict[str, Any] = config.service.model_dump()

    host = os.environ.get("HOST")
    if host:
        service["host"] = host

    port = os.environ.get("PORT")
    if port:
        try:
            service["port"] = int(port)
        except ValueError as error:
            raise ConfigurationError(
                f"Environment variable PORT must be an integer, got '{port}'."
            ) from error

    log_level = os.environ.get("LOG_LEVEL")
    if log_level:
        service["log_level"] = log_level

    try:
        config.service = ServiceConfig(**service)
    except ValidationError as error:
        raise ConfigurationError(
            f"Invalid configuration after applying environment overrides:\n"
            f"{error}"
        ) from error

    return config


__all__ = [
    "CONFIG_PATH_ENV_VAR",
    "DEFAULT_CONFIG_PATH",
    "Config",
    "ConfigurationError",
    "ServiceConfig",
    "load_config",
    "resolve_config_path",
]
