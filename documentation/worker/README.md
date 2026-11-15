# Worker

The worker takes jobs off the Bull queues in Redis and runs them: image and
video processing, notifications, and mutual friends. How jobs flow from the
web application to the worker and back is in
[Background Jobs](../architecture/background-jobs.md).

**Code:** `worker/index.js`, `worker/jobs/`, `worker/config/`

| File | Read it when |
| ---- | ------------ |
| [jobs.md](jobs.md) | Working on a job, or finding out what enqueues it and what it does. |

## Running

| | Command | Queues |
| - | ------- | ------ |
| Locally, with the stack | `docker compose up`, or `npm run dev` from the repository root | All of them. |
| Locally, alone | `npm run dev -w worker` | All of them. |
| One queue | `node index.js <queue>`, from `worker/` | Only that one. Staging and production run one worker deployment per queue. |

With no queue named (the default is `general`), one process works every
queue, which is what you want locally.

## Starting Up

`worker/index.js`:

1. Loads and validates the configuration (`worker/config/`, the same
   system as the web application; see
   [Configuration](../architecture/configuration.md)).
2. Creates and initializes `Core`, connecting to PostgreSQL and Redis.
3. **Loads the enabled feature flags once.** Unlike the web application,
   the worker doesn't reload them per job: after a flag changes, restart
   the worker (or roll out a new deployment) for jobs to see it.
4. Registers a processor for its queue (or every queue), with its
   concurrency:

| Queue | Concurrency per process |
| ----- | ----------------------- |
| `send-notifications` | 100 |
| `add-mutuals-for-relationship`, `remove-mutuals-for-relationship` | 10 |
| `resize-image`, `process-video` | 1 (Bull's default) |

On `SIGTERM` or `SIGINT` it calls `core.shutdown()`, which closes the
queues (waiting for running jobs to finish) and then its connections.

## What It Needs

The worker uses the same `packages/backend` DAOs and services as the web
application, the same database, Redis and storage, and ffmpeg (installed in
its Docker image) for video. Its scratch files go in `worker/tmp/`.
