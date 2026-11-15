# Add a Worker Job

How to move work into a new background job, on its own queue. How jobs
flow is in [Background Jobs](../architecture/background-jobs.md); the
existing jobs are in [Jobs](../worker/jobs.md).

## 1. Add the Queue

In `packages/backend/core.js`, add the queue's name to `QUEUES`. Name it
for what it does, in kebab-case (`rebuild-feed-cache`).

## 2. Write the Job

Put the work in a backend service (see [Services](../backend/services.md)),
and create `worker/jobs/<camelCaseName>.js` to call it:

```javascript
const { SomeService } = require('@communities/backend')

module.exports = function(core) {
    return async function(job, done) {
        try {
            core.logger.info(`Beginning job 'rebuild-feed-cache' for User(${job.data.session.user.id}).`)
            job.progress({ step: 'initializing', stepDescription: 'Initializing...', progress: 0 })

            const service = new SomeService(core)
            await service.doTheWork(job.data.thing)

            job.progress({ step: 'complete', stepDescription: 'Complete!', progress: 100 })
            done(null)
        } catch (error) {
            core.logger.error(error)
            done(error)
        }
    }
}
```

## 3. Register It in the Worker

In `worker/index.js`:

- [ ] Require the job.
- [ ] Add a branch for its queue name, with its concurrency:
      `core.queues['rebuild-feed-cache'].process(10, getRebuildFeedCache(core))`.
- [ ] Add the same line to the final `else`, which works every queue
      locally.

## 4. Add Jobs to It

Where the work comes from (a controller or service):

```javascript
await this.core.queues['rebuild-feed-cache'].add({
    session: { user: currentUser },
    thing: { id: thing.id }
}, { attempts: 2 })
```

- [ ] Include `session: { user }`, so progress can go to that user.
- [ ] Pass ids and small objects: the data is JSON in Redis.
- [ ] Choose `attempts` deliberately: retries are wrong for anything that
      sends messages (notifications use 1).

## 5. Report Progress to the Client (If It Needs It)

- [ ] Add `this.listen('<queue>')` to `JobEvents`'s constructor
      (`packages/backend/events/JobEvents.js`).
- [ ] In the client, subscribe with
      `useEventSubscription(key, 'Job', 'update', { jobId, queue })` and
      read the job from the `jobs` slice. See [Real-Time](../client/real-time.md).

## 6. Finish

- [ ] Test the service with unit tests, and the whole flow locally with the
      worker running.
- [ ] Add the job to the table in [Jobs](../worker/jobs.md) and
      [Background Jobs](../architecture/background-jobs.md).
- [ ] Say in the pull request that it adds a queue: staging and production
      need a worker deployment for it, which maintainers add in the
      infrastructure repository before the release that uses it.
