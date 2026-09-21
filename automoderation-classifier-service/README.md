# Automoderation Classifier Service

A decoupled Python / FastAPI service that scores text content against the
Communities content policies and Terms of Service.

Communities posts content to it and gets back a probability that the content
violates policy: `1.0` is a clear violation, `0.0` is clearly non-violating,
and values in between are the assembled confidence of the classifiers that ran.

> **Status: prototype.** The framework is real. The classifier is not — the
> shipped `NlpClassifier` is a skeleton that returns mock scores. Nothing this
> service currently returns should inform a moderation decision.

## Why it's a separate service

Communities is a monolith: Node/Express, Postgres, Redis-backed Bull queues.
This service is the first piece pulled out of it, and it is written in Python
because the classical NLP and machine learning tooling we will need — spaCy,
scikit-learn, the transformers ecosystem — is substantially better there than
in Node.

It is deliberately decoupled:

- **No database access.** It never sees Postgres.
- **No worker access.** It is not a Bull consumer and has no Redis connection.
- **No `@communities/*` packages.** It shares no code with the monolith, which
  is why its image builds without a CodeArtifact token.
- **No credentials.** It holds no secrets, so it reads no AWS Parameter Store.

The entire contract is one HTTP endpoint. That constraint is the point of the
experiment: if it holds, the service can be scaled, deployed, and rewritten
independently of Communities. Image and video moderation will eventually need
S3 access, which will be the first real test of how well the boundary holds.

## Architecture

```
       POST /classify  {"content": "...", "classifiers": ["nlp"]}
                      │
                      ▼
            ┌──────────────────────┐
            │ ClassificationService│   resolves requested names, runs those
            │                      │   concurrently, weighted-averages them
            └──────────┬───────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │ Classifier│  │ Classifier│  │ Classifier│   each returns a score in
  │  'nlp'    │  │  'llm'    │  │   ...     │   [0.0, 1.0], independently
  └───────────┘  └───────────┘  └───────────┘
        └───── all loaded at startup ─────┘
```

Every classifier is loaded once at application startup, so a request naming a
classifier never pays for its model load. Which ones actually *run* is decided
per request by the `classifiers` field.

Classifiers are **layered**: the named classifiers are all run over the same
content and their scores are combined into a weighted average. Each
classifier's individual score is returned alongside the average, so the caller
can see how it was reached.

| Path | What lives there |
| --- | --- |
| `main.py` | Entry point. Builds the FastAPI app and loads classifiers at startup. |
| `api/` | Request/response models and routes. The contract with Communities. |
| `classifiers/` | The `Classifier` interface and its implementations. |
| `config/` | Configuration schema, loader, and `config.yaml`. |
| `services/` | `ClassificationService` — the classifier registry, layering, and weighted averaging. |
| `test/` | Tests. |

Startup is fail-fast. If the configuration is invalid, the service does not
come up. A classifier service that booted misconfigured would answer requests
with scores that mean nothing, which is worse than being down.

## Setup for local development

Requires **Python 3.11 or newer** (the image uses 3.12).

From this directory:

### 1. Create a virtual environment

```
python3 -m venv .venv
```

### 2. Activate it

```
source .venv/bin/activate
```

On Windows: `.venv\Scripts\activate`

Your prompt should now be prefixed with `(.venv)`. Everything below assumes the
virtual environment is active. To leave it later, run `deactivate`.

### 3. Install dependencies

```
pip install --upgrade pip
pip install -r requirements.txt -r requirements-dev.txt
```

`requirements.txt` is the runtime; `requirements-dev.txt` adds pytest, httpx,
ruff, mypy and pyright. Both are pinned exactly, the way `package-lock.json`
pins the Node services.

`.venv/` is gitignored — it never gets committed and never goes in the image.
Creating it at exactly this path is what lets pyright find your packages when
the environment isn't activated; see [Testing and type
checking](#testing-and-type-checking).

### 4. Run the service

```
python main.py
```

It binds the host and port from `config/config.yaml` — by default
`http://0.0.0.0:8081`. For auto-reload on file changes, either:

```
RELOAD=true python main.py
```

or run uvicorn directly, which gives you its flags:

```
uvicorn main:app --reload --port 8081
```

### 5. Check that it works

```
curl http://localhost:8081/health
```

```json
{
  "status": "ok",
  "service": "automoderation-classifier-service",
  "classifiers": ["nlp"],
  "default_classifiers": ["nlp"]
}
```

Then classify something:

```
curl -X POST http://localhost:8081/classify \
  -H 'Content-Type: application/json' \
  -d '{"content": "Click here to double your money, guaranteed returns!"}'
```

```json
{
  "score": 0.75,
  "classifiers": {
    "nlp": 0.75
  }
}
```

FastAPI serves interactive API documentation at
[http://localhost:8081/docs](http://localhost:8081/docs) while the service is
running.

## Running in Docker Compose

The service is wired into the root `compose.yaml` as
`automoderation-classifier`. Unlike `worker` and `web-application`, it needs no
CodeArtifact token to build, and it has no `depends_on` — it does not wait for
Postgres or Redis because it does not use them.

From the repository root:

```
docker compose build automoderation-classifier
docker compose up automoderation-classifier
```

Or bring up the whole stack with `docker compose up` as usual.

The source tree is bind-mounted and uvicorn runs with `--reload`, so edits on
the host restart the service in the container. `--reload-include '*.yaml'`
means edits to `config/config.yaml` do too.

It is reachable at `http://localhost:8081` from the host, and at
`http://automoderation-classifier:8081` from the other containers — that second
address is what Communities will use when we wire the call up.

## API

### `POST /classify`

Scores a piece of text against the classifiers you name.

**Request**

```json
{
  "content": "[text content string -- could be post body or comment]",
  "classifiers": ["nlp"]
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `content` | string | Required. Must be non-empty and no longer than `service.max_content_length` (10,000 characters by default, matching the post body limit in `packages/shared/validation/entities/Post.js`). |
| `classifiers` | array of string | Optional. Short names of the classifiers to run. Omit the field to use the defaults — currently `["nlp"]`. |

Behaviour of `classifiers`:

- **Omitted** → the service defaults (`DEFAULT_CLASSIFIERS` in
  `services/classification.py`) are used.
- **Empty list** → `422`. "Run nothing" is never a sensible request, and
  honouring it would mean returning a score with nothing behind it.
- **Unknown name** → `422`, naming the unrecognized classifier and listing the
  valid ones. Unknown names are rejected rather than skipped: quietly ignoring
  one would return a score assembled from fewer checks than the caller asked
  for.
- **Repeated name** → run once, not counted twice in the average.

Unrecognized *fields* are rejected too, so a typo in the caller surfaces
immediately instead of silently doing nothing.

**Response — `200 OK`**

```json
{
  "score": 0.4,
  "classifiers": {
    "nlp": 0.3,
    "llm": 0.5
  }
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `score` | float | The weighted average across the classifiers that ran. `0.0`–`1.0`. |
| `classifiers` | object | Each classifier's individual score, keyed by its short name. |

Scores are JSON numbers, not strings, and are rounded to four decimal places.

**Response — `422 Unprocessable Entity`**

`content` is missing, empty, the wrong type, or over the length limit; or
`classifiers` is an empty list or names a classifier that doesn't exist.

**Response — `503 Service Unavailable`**

Every requested classifier failed. The content has **not** been classified —
callers must not treat this as a pass.

A *partial* failure is not an error: if two of three requested classifiers
succeed, the average of those two is returned with a `200`, the failures are
logged, and the failed classifier is simply absent from the `classifiers` map.
It is absent rather than reported as `0.0` deliberately — "did not run" and
"found nothing" are different claims, and conflating them would understate the
score.

### `GET /health`

Returns `200` with the service name, every classifier a request may ask for,
and the defaults used when a request names none. Used as the Docker Compose
healthcheck.

## Classifiers

Registered in `services/classification.py`:

```python
CLASSIFIERS: Mapping[str, Type[Classifier]] = {
    "nlp": NlpClassifier,
}

DEFAULT_CLASSIFIERS: Tuple[str, ...] = ("nlp",)
```

That mapping is the single source of truth for which classifiers exist and
what callers may name. The short names are part of the API contract —
Communities sends them and reads them back — so **renaming one is a breaking
change**.

### Weights

Each classifier carries a `weight` class attribute, defaulting to `1.0`:

```python
class HeavyClassifier(Classifier):
    weight: ClassVar[float] = 3.0
```

Weights are **relative, not absolute**. The average normalizes over the
classifiers that actually reported, so a classifier that fails shifts the score
toward the ones that remain rather than dragging it toward zero.

Weight lives on the class rather than in configuration or the request because
it is a property of how much we trust the classifier, not of how a deployment
is set up — and a caller should not be able to reweight our moderation signal
by changing a request body.

### Adding one

1. Add a module in `classifiers/` with a class extending `Classifier`:

   ```python
   from classifiers.base import ClassificationResult, Classifier


   class MyClassifier(Classifier):

       async def setup(self) -> None:
           # Load models here, not in __init__.  Runs once, at startup.
           self.model = load_my_model()

       async def classify(self, content: str) -> ClassificationResult:
           return ClassificationResult(
               score=0.5,
               metadata={"why": "for the moderator's benefit, later"},
           )
   ```

2. Register it in `services/classification.py`:

   ```python
   CLASSIFIERS: Mapping[str, Type[Classifier]] = {
       "nlp": NlpClassifier,
       "mine": MyClassifier,
   }
   ```

3. Restart. Callers can now ask for `"mine"`. Add it to
   `DEFAULT_CLASSIFIERS` if it should run when a request names nothing.

Notes on implementing one:

- `classify()` is **async** so that classifiers doing network I/O — an LLM API
  call, say — can layer in without blocking the event loop. Requested
  classifiers run concurrently.
- A CPU-bound classifier that does real work should hand it off with
  `fastapi.concurrency.run_in_threadpool`, or a process pool if it holds the
  GIL for a long time. Doing heavy synchronous work directly in `classify()`
  stalls the loop for every other request.
- `setup()` runs at startup for **every** registered classifier, whether or not
  any request asks for it. Load models there, not on first use.
- `ClassificationResult.metadata` is free-form. The endpoint does not surface
  it yet, but it is where explanations belong — matched terms, per-category
  sub-scores, model versions — for when we want to show moderators *why*
  something was flagged.
- Raising from `classify()` is survivable: the service logs it and drops that
  classifier from the average. Raising from `setup()` is not, and shouldn't be.

## Configuration

`config/config.yaml` covers how the service runs — where it binds, how it logs,
what it will accept. It does **not** cover which classifiers exist or run;
that's the registry above and the `classifiers` field on the request.

```yaml
service:
  name: automoderation-classifier-service
  host: 0.0.0.0
  port: 8081
  log_level: INFO
  max_content_length: 10000
```

### Environment variables

| Variable | Overrides |
| --- | --- |
| `AUTOMODERATION_CONFIG_PATH` | Which configuration file to load. |
| `HOST` | `service.host` |
| `PORT` | `service.port` |
| `LOG_LEVEL` | `service.log_level` |
| `RELOAD` | `true` makes `python main.py` run with auto-reload. |

## Testing, linting and type checking

**From this directory**, with the virtual environment active:

```
pytest
ruff check .
mypy .
pyright
```

All four should be clean. The tests cover classifier selection, weighted
averaging, and degradation behaviour, and exercise `POST /classify` against the
real `config/config.yaml` — so a configuration file that no longer loads fails
the suite.

Settings for all of them live in `pyproject.toml`. Both type checkers run at
their **default** settings; nothing is loosened, and the code is clean under
`mypy --strict` too, if you want to raise the bar.

Ruff is the exception to "defaults": its rule set is **selected explicitly**,
because ruff's default set changes between releases and an upgrade would
otherwise start reporting findings on code nobody touched. Annotations use
PEP 585 and PEP 604 syntax throughout (`dict[str, float]`, `X | None`) rather
than the deprecated `typing` aliases, which is what `target-version = "py311"`
and the `UP` rules enforce.

One rule is switched off, `TRY003`, and the reasoning is in `pyproject.toml`
next to the setting: our exceptions carry runtime detail that makes them
actionable, and the rule wants that text hoisted into the exception classes
where it would lose exactly that.

`ruff format` is *not* enforced — the source is hand-wrapped at 79 columns and
running the formatter will restyle it. If you'd rather let the formatter own
layout, that's a reasonable call; just do it as its own commit.

### If pyright reports missing imports

`Import "fastapi" could not be resolved (reportMissingImports)` and friends
mean pyright is looking at the wrong Python environment — not that anything is
wrong with the code. Three things cause it:

- **The virtual environment isn't active.** Activating it is enough on its own;
  pyright then finds the packages with no configuration at all. The
  `[tool.pyright]` block in `pyproject.toml` covers the case where you haven't
  activated — an editor or a pre-commit hook, say — by pointing at `.venv`.
- **You ran it from the repository root.** The `venvPath` in `pyproject.toml`
  is relative to that file, so pyright has to be run from this directory, the
  same as pytest and mypy. `cd automoderation-classifier-service` first.
- **The config file was renamed.** Pyright reads `pyproject.toml` and
  `pyrightconfig.json` and nothing else. A file called `pyright.json` is
  silently ignored, and you get the errors back with no explanation.

Your editor's Python extension has its own interpreter setting, separate from
the CLI. If the CLI is clean and the editor isn't, point the editor at
`automoderation-classifier-service/.venv`.

### Which tool is talking to you

Editors merge diagnostics from every tool into one list, which makes it easy to
attribute a message to the wrong one. A quick way to tell them apart:

| Message looks like | It's from |
| --- | --- |
| `Use "X \| None" for type annotations`, `UP045`, any `UP`/`B`/`SIM`/`TRY` code | ruff |
| `Import "fastapi" could not be resolved`, `reportMissingImports` | pyright |
| `Library stubs not installed for "yaml"`, `[import-untyped]` | mypy |

Rule codes are the giveaway — pyright names its rules `reportSomething`, mypy
uses `[bracketed-slugs]`, and ruff uses letter-plus-number codes. To settle it,
run each tool on its own from this directory.

## What this is not, yet

Known gaps, roughly in the order they will start to matter:

- **The classifier is a stub.** `NlpClassifier` returns mock values driven by a
  handful of placeholder spam markers. `classifiers/nlp.py` ends with notes on
  what implementing it for real involves, including which policy categories
  classical NLP can plausibly handle and which it cannot.
- **No authentication.** Any process that can reach the port can call it —
  including choosing which classifiers run. Fine on a local compose network;
  not fine anywhere else. Before this is deployed it needs a shared secret or
  mTLS between Communities and the service.
- **No per-classifier timeout.** A hanging classifier will hang the request.
  This is harmless with an in-process stub and will not be once a classifier is
  making network calls.
- **No rate limiting or request size limits** beyond the content length check.
- **Text only.** Image and video moderation will need S3 access.
- **No Kubernetes deployment.** Local compose only, by design for this pass.
- **Not in CI.** `.github/workflows/ci.yaml` does not know about this service.

## License

Part of Communities, which is licensed under the GNU Affero General Public
License v3. See `LICENSE` at the repository root.
