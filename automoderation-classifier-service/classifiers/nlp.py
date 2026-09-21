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
"""A classical NLP classifier.

*** THIS IS A SKELETON.  IT RETURNS MOCK VALUES. ***

The class, its registration, and its result shape are real; the scoring is
not.  It exists so the rest of the framework -- classifier selection, layering,
weighted averaging, the endpoint -- can be built and exercised end to end
before we invest in the actual model.

See "Implementing this for real" at the bottom of this file for the intended
pipeline.
"""

from __future__ import annotations

import re
from re import Pattern
from typing import ClassVar

from classifiers.base import ClassificationResult, Classifier

# ---------------------------------------------------------------------------
# PLACEHOLDER lexicon.
#
# These are spam markers, and they are here *only* so that the mock returns
# different scores for different content, which makes the wiring visible when
# you curl the endpoint.  They are not a moderation lexicon and they are not
# tuned against anything.  The real implementation replaces this wholesale
# (see the notes at the bottom of the file).
# ---------------------------------------------------------------------------
PLACEHOLDER_SPAM_MARKERS: list[str] = [
    "act now",
    "buy now",
    "click here",
    "crypto giveaway",
    "dm me",
    "double your money",
    "free money",
    "guaranteed returns",
    "limited time offer",
    "make money fast",
    "risk free",
    "work from home",
]

TOKEN_PATTERN: Pattern[str] = re.compile(r"[\w']+")

WHITESPACE_PATTERN: Pattern[str] = re.compile(r"\s+")


class NlpClassifier(Classifier):
    """Scores content using classical (pre-LLM) natural language processing.

    Registered as `nlp`, and the default classifier when a request names none.

    The mock constants below stand in for a model.  None of them survive the
    real implementation.
    """

    #: Score returned for content that trips none of the placeholder markers.
    MOCK_BASELINE_SCORE: ClassVar[float] = 0.0

    #: Score returned for content that trips at least one placeholder marker.
    MOCK_MARKER_SCORE: ClassVar[float] = 0.75

    #: Content with fewer tokens than this scores 0.0 -- too little signal.
    MIN_TOKENS: ClassVar[int] = 3

    async def setup(self) -> None:
        """Where the real model gets loaded.  Nothing to load yet."""
        self.logger.warning(
            "NlpClassifier '%s' is a SKELETON and returns mock scores. "
            "Do not rely on its output for moderation decisions.",
            self.name,
        )

    async def classify(self, content: str) -> ClassificationResult:
        """Return a mock score for `content`.

        The shape of what happens here is the shape the real implementation
        will have -- normalize, tokenize, extract features, score, explain --
        but each step is a stand-in.
        """
        normalized = self._normalize(content)
        tokens = self._tokenize(normalized)

        if len(tokens) < self.MIN_TOKENS:
            return ClassificationResult(
                score=0.0,
                metadata={
                    "mock": True,
                    "reason": "too-short",
                    "token_count": len(tokens),
                },
            )

        matched = [
            marker for marker in PLACEHOLDER_SPAM_MARKERS if marker in normalized
        ]

        score = self.MOCK_MARKER_SCORE if matched else self.MOCK_BASELINE_SCORE

        return ClassificationResult(
            score=score,
            metadata={
                "mock": True,
                "reason": "placeholder-markers" if matched else "baseline",
                "matched_markers": matched,
                "token_count": len(tokens),
            },
        )

    def _normalize(self, content: str) -> str:
        """Casefold and collapse whitespace.

        The real version also has to handle the evasion techniques people
        actually use: unicode homoglyphs, zero-width joiners, leetspeak,
        and character padding.
        """
        return WHITESPACE_PATTERN.sub(" ", content.casefold()).strip()

    def _tokenize(self, normalized: str) -> list[str]:
        """Split into word tokens.

        A regex is enough for a placeholder.  The real version uses a proper
        tokenizer so that lemmatization and part-of-speech tagging have
        something well-formed to work with.
        """
        return TOKEN_PATTERN.findall(normalized)


# ---------------------------------------------------------------------------
# Implementing this for real
# ---------------------------------------------------------------------------
#
# The Community Standards (Terms of Service D.3) name five categories, and
# Content Restrictions (D.2) name six more.  They are not equally tractable
# with classical NLP, and we should not pretend otherwise:
#
#   Tractable with classical methods:
#     - Spam / AI slop.  Well-trodden ground.  TF-IDF or character n-grams
#       into a linear model (LogisticRegression / LinearSVC) gets a long way,
#       and spam is the category where a false positive costs the least.
#     - Sexually explicit text.  Lexicon plus a supervised classifier.
#
#   Hard, and probably needing an LLM layer to do responsibly:
#     - Hate speech and denial of basic humanity.  Classical models are
#       notoriously bad at this: they over-flag reclaimed language and
#       in-group speech, and they under-flag implicit dehumanization that
#       carries no lexical markers at all.  Whatever we ship here must be
#       measured for disparate false-positive rates across the protected
#       characteristics named in D.3 before it touches production traffic.
#     - Abuse and harassment.  Heavily context- and relationship-dependent;
#       the same sentence between friends and between strangers is not the
#       same act.  This classifier only ever sees the text, which is a real
#       ceiling on how well it can do here.
#     - Misinformation / disinformation.  Requires external knowledge.  Out
#       of scope for a text classifier; needs retrieval, at minimum.
#
# A reasonable first real pass:
#
#   1. Normalization that defeats common evasion (confusables mapping,
#      zero-width character stripping, leet-to-ascii).
#   2. spaCy for tokenization, lemmatization, and named entity recognition
#      (targeting -- whether a slur is aimed at a person or group -- matters
#      more than mere presence).
#   3. Per-category scores from a TF-IDF + linear model trained on our own
#      moderation history.  We have labels: the `site_moderations` and
#      `group_moderations` tables record human decisions with a `status` of
#      'approved' or 'rejected'.  That is the training set, with the usual
#      caveat that it encodes our moderators' past biases along with their
#      judgment.
#   4. Combine per-category scores into the single score this interface
#      returns -- probably a max rather than a mean, since a clear violation
#      in one category is a violation regardless of the others -- and put the
#      per-category breakdown in `ClassificationResult.metadata`.
#   5. Calibrate.  A raw decision function is not a probability.  Platt
#      scaling or isotonic regression against a held-out set, so that "0.7"
#      means something consistent to whoever sets the thresholds.
#
# Whatever we build, the scores it produces should route to human review, not
# to automated removal, until we have precision/recall numbers we trust.
