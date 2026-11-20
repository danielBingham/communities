# Add a Worker Job

How to move work into a new background job, on its own queue. How the
worker runs jobs is in [Worker](../architecture/worker.md).

**Code:** `packages/backend/core.js`, `worker/index.js`, `worker/jobs/`,
`packages/backend/events/JobEvents.js`

## Checklist

- [ ] **Add the queue** to `QUEUES` in `packages/backend/core.js`, named in
      kebab-case for what it does (`rebuild-feed-cache`).
- [ ] **Put the work in a backend service**, and write
      `worker/jobs/<camelCaseName>.js` to call it, following an existing
      job: report progress with `job.progress()`, and finish with `done()`
      or `done(error)`.
- [ ] **Register it in `worker/index.js`**, twice: a branch for its queue
      name, with its concurrency, and the same line in the final `else`,
      which works every queue locally.
- [ ] **Add jobs to it** where the work comes from:
      `core.queues['rebuild-feed-cache'].add({ session: { user }, ... }, { attempts })`.
      Include `session: { user }`, so progress can go to that user. Pass
      ids and small objects, since the data is JSON in Redis. Choose
      `attempts` deliberately: retrying is wrong for anything that sends
      messages.
- [ ] **If the client shows its progress**, add `this.listen('<queue>')`
      to `JobEvents`'s constructor, and subscribe in the client with
      `useEventSubscription(key, 'Job', 'update', { jobId, queue })`.
- [ ] **Test** the service with unit tests, and the whole flow locally
      with the worker running.
- [ ] **Say in the pull request that it adds a queue.** Staging and
      production run a worker deployment per queue, which maintainers add
      in the infrastructure repository before the release that uses it.
