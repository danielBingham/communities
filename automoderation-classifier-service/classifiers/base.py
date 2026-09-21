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
"""The `Classifier` interface that all classifiers implement.

A classifier takes a piece of text content and returns a score between `0.0`
and `1.0` representing the probability that the content violates the
Communities content policies (Terms of Service Section D, "Acceptable Use").

Classifiers are layered: the caller names the classifiers it wants on each
request, the service runs those over the content, and their scores are
combined into a weighted average.  Implementations are independent of one
another -- a classifier never sees another classifier's result.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, ClassVar


@dataclass(frozen=True)
class ClassificationResult:
    """The result of a single classifier's run over a single piece of content.

    Attributes:
        score: Probability the content violates policy.  `1.0` is a clear
            violation, `0.0` is clearly non-violating, and values in between
            represent the classifier's confidence that it violates.
        metadata: Free-form detail about how the classifier arrived at the
            score -- matched terms, per-category sub-scores, model version,
            and so on.  The `POST /classify` response does not surface this
            yet, but it is the natural place to hang explanations when we want
            to show moderators *why* something was flagged.
    """

    score: float
    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if isinstance(self.score, bool) or not isinstance(self.score, (int, float)):
            raise TypeError(
                f"ClassificationResult.score must be a number, "
                f"got {type(self.score).__name__}."
            )

        if not 0.0 <= float(self.score) <= 1.0:
            raise ValueError(
                f"ClassificationResult.score must be between 0.0 and 1.0, "
                f"got {self.score}."
            )


class Classifier(ABC):
    """Base class for content classifiers.

    Subclasses must implement `classify()`.  They may also override `setup()`
    and `teardown()` to manage expensive resources -- loading a model off disk,
    opening an HTTP client for a remote API -- which are called once at
    application startup and shutdown respectively rather than per request.

    `classify()` is asynchronous so that classifiers doing network I/O (an LLM
    API call, for instance) can be layered in without blocking the event loop.
    The service runs the requested classifiers concurrently.  A CPU-bound
    classifier that does real work should hand that work off to a thread with
    `fastapi.concurrency.run_in_threadpool` (or a process pool, if it holds the
    GIL for long) so that it doesn't stall the loop for other requests.

    Every subclass is registered in `services.classification.CLASSIFIERS`
    under the short name callers use to ask for it.
    """

    #: This classifier's weight in the weighted average, relative to the other
    #: classifiers in the same request.  A classifier we trust more carries
    #: more of the final score.  It lives on the class rather than in
    #: configuration because it is a property of how good the classifier is,
    #: not of how a particular deployment is set up -- and a caller should not
    #: be able to reweight our moderation signal by changing a request.
    weight: ClassVar[float] = 1.0

    def __init__(self, name: str) -> None:
        """
        Args:
            name: The short name this classifier is registered under.  It is
                the key the classifier's score is reported under in the API
                response, and the name callers use to request it.
        """
        self.name = name
        self.logger = logging.getLogger(f"classifiers.{name}")

    async def setup(self) -> None:
        """Prepare the classifier for use.  Called once, at startup.

        Load models, warm caches, and open clients here rather than in
        `__init__` so that startup failures surface against a running event
        loop and slow loads happen once instead of on the first request.

        Every classifier is loaded at startup, whether or not any given
        request asks for it, so that the first request naming a classifier
        does not pay for its model load.
        """
        return

    @abstractmethod
    async def classify(self, content: str) -> ClassificationResult:
        """Score `content` for policy violation.

        Args:
            content: The text to classify.  A post body or a comment body.

        Returns:
            A `ClassificationResult` carrying a score in `[0.0, 1.0]`.

        Raises:
            Exception: Implementations may raise.  The service catches
                per-classifier failures, logs them, and excludes the failed
                classifier from the weighted average rather than failing the
                whole request -- so one broken classifier degrades the score
                instead of taking moderation offline.
        """
        raise NotImplementedError

    async def teardown(self) -> None:
        """Release anything `setup()` acquired.  Called once, at shutdown."""
        return

    def __repr__(self) -> str:
        return f"<{type(self).__name__} name={self.name!r}>"
