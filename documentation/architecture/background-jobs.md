# Background Jobs

How long-running work leaves the request: the web application puts a job on
a Bull queue in Redis, a worker takes it, and progress flows back to the
client as events.

**Code:** `packages/backend/core.js`, `worker/index.js`, `worker/jobs/`,
`packages/backend/events/JobEvents.js`, `web-application/client/state/jobs.js`

## The Queues

`Core` creates one Bull queue per kind of job (`QUEUES` in
`packages/backend/core.js`). One queue per kind is how parallelism is
controlled: Bull can't limit concurrency per job type within one queue.

| Queue | Job | Added by |
| ----- | --- | -------- |
| `resize-image` | Resize an uploaded image into its variants. | Uploading an image. |
| `process-video` | Transcode an uploaded video and make its poster image. | Uploading a video. |
| `send-notifications` | Create notifications and send them by web, email and push. | Posts, comments, reactions, friendships, group activity. |
| `add-mutuals-for-relationship` | Update mutual friends when a friendship is confirmed. | Confirming a friend request. |
| `remove-mutuals-for-relationship` | Update mutual friends when a friendship ends. | Removing a friend. |

What each job does is in [Jobs](../worker/jobs.md).

## The Flow

1. **A controller or service adds a job:**
   `core.queues['resize-image'].add({ session, file, ... })`. The job's data
   carries the current user's session, so progress can be sent back to
   them.
2. **A worker takes it.** On staging and production, each worker process
   works one queue, named on its command line (`node index.js resize-image`),
   with the concurrency set in `worker/index.js`. Locally, one worker works
   every queue.
3. **The job reports progress** with `job.progress({ step, stepDescription,
   progress })`, and finishes by calling `done()`, or `done(error)` if it
   failed.
4. **`JobEvents` in each web instance** listens to the queues' global
   events (`active`, `progress`, `completed`, `failed`) and publishes a
   `Job:update` event to the user who added the job.
5. **The client** tracks the job in the `jobs` slice, and upload components
   subscribe to their job's updates. See
   [Real-Time Events](real-time-events.md).

## What Goes in a Job

Anything slow, or that talks to an outside service on behalf of many
users: processing media, fanning out notifications, recomputing derived
data. A request should return without waiting for it. The job's data is
JSON in Redis, so pass ids and small objects, not whole query results.

A job reads and writes the same database and storage as the web
application, through the same DAOs and services in `packages/backend`.

## Deployment

Each queue runs as its own worker deployment on staging and production,
so a backlog in one (a long video) doesn't hold up another
(notifications). Adding a queue means adding a deployment, which is handled
in the infrastructure repository. See
[Add a Worker Job](../how-to/add-a-worker-job.md).
