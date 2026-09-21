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
"""Tests for classifier selection, layering, and weighted averaging."""

from __future__ import annotations

from collections.abc import Mapping
from typing import ClassVar

import pytest

from classifiers.base import ClassificationResult, Classifier
from services.classification import (
    AllClassifiersFailedError,
    ClassificationService,
    UnknownClassifierError,
)


class LowClassifier(Classifier):
    """Always scores 0.3."""

    async def classify(self, content: str) -> ClassificationResult:
        return ClassificationResult(score=0.3)


class HighClassifier(Classifier):
    """Always scores 0.9."""

    async def classify(self, content: str) -> ClassificationResult:
        return ClassificationResult(score=0.9)


class HeavyClassifier(Classifier):
    """Always scores 0.9, and carries three times the usual weight."""

    weight: ClassVar[float] = 3.0

    async def classify(self, content: str) -> ClassificationResult:
        return ClassificationResult(score=0.9)


class FailingClassifier(Classifier):
    """Always raises, to exercise the degradation path."""

    async def classify(self, content: str) -> ClassificationResult:
        raise RuntimeError("classifier exploded")


REGISTRY: Mapping[str, type[Classifier]] = {
    "low": LowClassifier,
    "high": HighClassifier,
    "heavy": HeavyClassifier,
    "broken": FailingClassifier,
}


@pytest.fixture
def service() -> ClassificationService:
    return ClassificationService.load(REGISTRY)


async def test_named_classifier_score_is_returned_directly(
    service: ClassificationService,
) -> None:
    outcome = await service.classify("some content", ["low"])

    assert outcome.score == 0.3
    assert outcome.scores == {"low": 0.3}
    assert outcome.failures == {}


async def test_scores_are_averaged_across_requested_classifiers(
    service: ClassificationService,
) -> None:
    outcome = await service.classify("some content", ["low", "high"])

    assert outcome.score == 0.6
    assert outcome.scores == {"low": 0.3, "high": 0.9}


async def test_class_weights_are_applied(service: ClassificationService) -> None:
    # 0.3 at weight 1 and 0.9 at weight 3 -> (0.3 + 2.7) / 4 == 0.75
    outcome = await service.classify("some content", ["low", "heavy"])

    assert outcome.score == 0.75


async def test_only_the_requested_classifiers_run(
    service: ClassificationService,
) -> None:
    outcome = await service.classify("some content", ["high"])

    assert set(outcome.scores) == {"high"}


async def test_repeated_names_are_run_once(
    service: ClassificationService,
) -> None:
    outcome = await service.classify("some content", ["low", "low", "high"])

    # Counting 'low' twice would drag the average to 0.5.
    assert outcome.score == 0.6
    assert outcome.scores == {"low": 0.3, "high": 0.9}


async def test_unknown_classifier_is_rejected(
    service: ClassificationService,
) -> None:
    with pytest.raises(UnknownClassifierError) as caught:
        await service.classify("some content", ["low", "nope"])

    assert caught.value.unknown == ("nope",)
    assert "low" in caught.value.available


async def test_failed_classifier_is_excluded_rather_than_scored_zero(
    service: ClassificationService,
) -> None:
    outcome = await service.classify("some content", ["high", "broken"])

    # The average normalizes over the weight that actually reported, so the
    # surviving classifier's score stands rather than being halved.
    assert outcome.score == 0.9
    assert outcome.scores == {"high": 0.9}
    assert "broken" in outcome.failures


async def test_raises_when_every_requested_classifier_fails(
    service: ClassificationService,
) -> None:
    with pytest.raises(AllClassifiersFailedError):
        await service.classify("some content", ["broken"])


def test_resolve_falls_back_to_defaults(service: ClassificationService) -> None:
    from services.classification import DEFAULT_CLASSIFIERS

    # The fixture registry doesn't contain the real defaults, so resolving
    # None against it should fail on the default name -- which proves the
    # fallback is reaching for DEFAULT_CLASSIFIERS rather than nothing.
    with pytest.raises(UnknownClassifierError) as caught:
        service.resolve(None)

    assert caught.value.unknown == tuple(DEFAULT_CLASSIFIERS)


def test_available_lists_every_loaded_classifier(
    service: ClassificationService,
) -> None:
    assert service.available == ["broken", "heavy", "high", "low"]


def test_result_score_must_be_a_probability() -> None:
    with pytest.raises(ValueError):
        ClassificationResult(score=1.5)

    with pytest.raises(ValueError):
        ClassificationResult(score=-0.1)
