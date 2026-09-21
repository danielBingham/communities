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
"""Layers the requested classifiers and combines their scores.

This is the piece that makes classifiers composable.  Every classifier is
loaded at startup; each request names the ones it wants.  Those are run over
the content, concurrently, and their scores are reduced to a single weighted
average.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field

from classifiers.base import ClassificationResult, Classifier
from classifiers.nlp import NlpClassifier

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# The classifier registry.
#
# Short name -> class.  This mapping is the single source of truth for which
# classifiers exist and what callers may ask for.  Adding a classifier means
# writing the class in `classifiers/` and adding one line here.
#
# The names are part of the API contract: Communities sends them in the
# request and reads them back in the response, so renaming one is a breaking
# change.
# ---------------------------------------------------------------------------
CLASSIFIERS: Mapping[str, type[Classifier]] = {
    "nlp": NlpClassifier,
    # "llm": LlmClassifier,  # not implemented yet
}

# Used when a request does not name any classifiers.  Deliberately
# conservative: the default is what Communities gets when it doesn't think
# about it, so it should be the cheap, well-understood layer.
DEFAULT_CLASSIFIERS: tuple[str, ...] = ("nlp",)

# Scores are rounded before they leave the service.  A weighted average of
# floats produces things like 0.30000000000000004, which is noise in a
# probability and ugly in a response body.
SCORE_PRECISION = 4


class UnknownClassifierError(Exception):
    """Raised when a request names a classifier that is not registered.

    Attributes:
        unknown: The names that were not recognized, in the order given.
        available: Every registered name, sorted.
    """

    def __init__(self, unknown: Sequence[str], available: Sequence[str]) -> None:
        self.unknown: tuple[str, ...] = tuple(unknown)
        self.available: tuple[str, ...] = tuple(available)

        super().__init__(
            f"Unknown classifier(s): {', '.join(self.unknown)}.  "
            f"Available: {', '.join(self.available)}."
        )


class AllClassifiersFailedError(Exception):
    """Raised when every requested classifier failed on a piece of content.

    A partial result is still a result -- if two of three classifiers ran, the
    average of those two is reported.  But a response with no classifiers
    behind it would be a fabricated score, so the request fails instead.
    """


@dataclass(frozen=True)
class ClassificationOutcome:
    """The result of running the requested classifiers over one piece of content.

    Attributes:
        score: The weighted average across the classifiers that succeeded.
        scores: Each successful classifier's score, keyed by classifier name.
        results: Each successful classifier's full result, keyed by name.
            Carries the metadata the API does not surface yet.
        failures: Error messages for classifiers that raised, keyed by name.
    """

    score: float
    scores: dict[str, float]
    results: dict[str, ClassificationResult] = field(default_factory=dict)
    failures: dict[str, str] = field(default_factory=dict)


class ClassificationService:
    """Holds every loaded classifier and runs the subset a request asks for."""

    def __init__(self, classifiers: Mapping[str, Classifier]) -> None:
        self.classifiers: dict[str, Classifier] = dict(classifiers)

    @classmethod
    def load(
        cls, registry: Mapping[str, type[Classifier]] | None = None
    ) -> ClassificationService:
        """Instantiate every registered classifier.

        Args:
            registry: The name-to-class mapping to load.  Defaults to
                `CLASSIFIERS`.  Tests pass their own.

        Returns:
            A service holding one instance of each registered classifier.
        """
        mapping = CLASSIFIERS if registry is None else registry

        classifiers = {
            name: classifier_class(name)
            for name, classifier_class in mapping.items()
        }

        return cls(classifiers)

    @property
    def available(self) -> list[str]:
        """Every loaded classifier name, sorted."""
        return sorted(self.classifiers)

    async def setup(self) -> None:
        """Run every classifier's `setup()`.  Called once, at startup.

        All of them, not just the default ones: a request naming a classifier
        should not be the thing that pays to load its model.
        """
        for classifier in self.classifiers.values():
            await classifier.setup()

    async def teardown(self) -> None:
        """Run every classifier's `teardown()`.  Called once, at shutdown.

        Failures are logged and swallowed: one classifier that cannot clean up
        after itself should not stop the others from trying.
        """
        for classifier in self.classifiers.values():
            try:
                await classifier.teardown()
            except Exception:
                logger.exception(
                    "Classifier '%s' raised during teardown.", classifier.name
                )

    def resolve(self, names: Sequence[str] | None = None) -> list[Classifier]:
        """Turn requested classifier names into loaded classifiers.

        Args:
            names: The names the caller asked for.  `None` means the caller
                did not ask, and gets `DEFAULT_CLASSIFIERS`.

        Returns:
            The matching classifiers, in the order requested, de-duplicated.
            A name repeated in the request is run once rather than counted
            twice in the average.

        Raises:
            UnknownClassifierError: If any name is not registered.  This is
                all-or-nothing: quietly skipping an unrecognized name would
                return a score assembled from fewer checks than the caller
                asked for, which is exactly the kind of silent weakening of
                moderation we don't want.
            ValueError: If no classifiers were resolved at all.  The API
                rejects an empty `classifiers` list before it reaches here, so
                this means `DEFAULT_CLASSIFIERS` is empty -- a bug, not bad
                input.
        """
        requested: Sequence[str] = DEFAULT_CLASSIFIERS if names is None else names

        if not requested:
            raise ValueError(
                "No classifiers to run.  DEFAULT_CLASSIFIERS must name at "
                "least one classifier."
            )

        unknown = [name for name in requested if name not in self.classifiers]
        if unknown:
            raise UnknownClassifierError(unknown, self.available)

        return self._deduplicate(requested)

    def _deduplicate(self, names: Iterable[str]) -> list[Classifier]:
        """Resolve names to classifiers, keeping first-seen order."""
        seen: set[str] = set()
        classifiers: list[Classifier] = []

        for name in names:
            if name in seen:
                continue

            seen.add(name)
            classifiers.append(self.classifiers[name])

        return classifiers

    async def classify(
        self, content: str, names: Sequence[str] | None = None
    ) -> ClassificationOutcome:
        """Score `content` against the requested classifiers.

        Classifiers run concurrently.  One that raises is logged and dropped
        from the average rather than failing the request -- a broken classifier
        should degrade the score, not take moderation offline.  Because the
        average is normalized over the weights that actually reported, a
        dropped classifier shifts the score toward the ones that remain rather
        than dragging it toward zero.

        Args:
            content: The text to classify.
            names: Classifiers to run.  `None` uses `DEFAULT_CLASSIFIERS`.

        Returns:
            A `ClassificationOutcome`.

        Raises:
            UnknownClassifierError: If any requested name is not registered.
            AllClassifiersFailedError: If no classifier returned a score.
        """
        classifiers = self.resolve(names)

        results = await asyncio.gather(
            *(classifier.classify(content) for classifier in classifiers),
            return_exceptions=True,
        )

        scores: dict[str, float] = {}
        succeeded: dict[str, ClassificationResult] = {}
        failures: dict[str, str] = {}

        weighted_total = 0.0
        weight_total = 0.0

        # strict=True: asyncio.gather returns exactly one result per input, so
        # a length mismatch is a bug, not something to silently truncate.
        for classifier, result in zip(classifiers, results, strict=True):
            name = classifier.name

            if isinstance(result, BaseException):
                logger.error(
                    "Classifier '%s' failed and will be excluded from the score.",
                    name,
                    exc_info=result,
                )
                failures[name] = f"{type(result).__name__}: {result}"
                continue

            if not isinstance(result, ClassificationResult):
                message = (
                    f"Classifier '{name}' returned "
                    f"{type(result).__name__}, expected ClassificationResult."
                )
                logger.error(message)
                failures[name] = message
                continue

            score = round(float(result.score), SCORE_PRECISION)

            scores[name] = score
            succeeded[name] = result

            weighted_total += score * classifier.weight
            weight_total += classifier.weight

        if weight_total <= 0:
            raise AllClassifiersFailedError(
                "Every requested classifier failed: "
                + "; ".join(f"{name} ({error})" for name, error in failures.items())
            )

        return ClassificationOutcome(
            score=round(weighted_total / weight_total, SCORE_PRECISION),
            scores=scores,
            results=succeeded,
            failures=failures,
        )
