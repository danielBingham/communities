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
"""Tests for POST /classify, built on the shipped configuration file."""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from config import load_config
from main import create_app


@pytest.fixture
def client() -> Iterator[TestClient]:
    """A client running the app against the real config/config.yaml.

    Using the shipped configuration rather than a fixture means these tests
    also catch a configuration file that no longer loads.
    """
    with TestClient(create_app(load_config())) as test_client:
        yield test_client


def classify(client: TestClient, **body: Any) -> dict[str, Any]:
    response = client.post("/classify", json=body)

    assert response.status_code == 200, response.text

    result: dict[str, Any] = response.json()
    return result


def test_classify_returns_the_documented_body_shape(client: TestClient) -> None:
    body = classify(client, content="Hello, world!")

    assert set(body.keys()) == {"score", "classifiers"}
    assert isinstance(body["score"], float)
    assert "nlp" in body["classifiers"]
    assert 0.0 <= body["score"] <= 1.0


def test_classifiers_field_is_optional_and_defaults_to_nlp(
    client: TestClient,
) -> None:
    body = classify(client, content="Hello, world!")

    assert list(body["classifiers"]) == ["nlp"]


def test_classifiers_can_be_named_explicitly(client: TestClient) -> None:
    body = classify(client, content="Hello, world!", classifiers=["nlp"])

    assert list(body["classifiers"]) == ["nlp"]


def test_score_matches_the_weighted_average_of_the_classifiers(
    client: TestClient,
) -> None:
    body = classify(client, content="Hello, world!")

    # One classifier ran, so the average is just its score.
    assert body["score"] == body["classifiers"]["nlp"]


def test_placeholder_markers_move_the_score(client: TestClient) -> None:
    clean = classify(client, content="A perfectly ordinary post about bread.")
    spammy = classify(
        client,
        content="Click here to double your money, guaranteed returns!",
    )

    assert spammy["score"] > clean["score"]


def test_unknown_classifier_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/classify", json={"content": "Hello!", "classifiers": ["telepathy"]}
    )

    assert response.status_code == 422
    assert "telepathy" in response.json()["detail"]


def test_empty_classifier_list_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/classify", json={"content": "Hello!", "classifiers": []}
    )

    assert response.status_code == 422


def test_content_is_required(client: TestClient) -> None:
    response = client.post("/classify", json={})

    assert response.status_code == 422


def test_empty_content_is_rejected(client: TestClient) -> None:
    response = client.post("/classify", json={"content": ""})

    assert response.status_code == 422


def test_unknown_fields_are_rejected(client: TestClient) -> None:
    response = client.post(
        "/classify", json={"content": "Hello!", "classifier": ["nlp"]}
    )

    assert response.status_code == 422


def test_content_over_the_limit_is_rejected(client: TestClient) -> None:
    response = client.post("/classify", json={"content": "a" * 10001})

    assert response.status_code == 422


def test_health_reports_available_and_default_classifiers(
    client: TestClient,
) -> None:
    response = client.get("/health")

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "ok"
    assert "nlp" in body["classifiers"]
    assert body["default_classifiers"] == ["nlp"]
