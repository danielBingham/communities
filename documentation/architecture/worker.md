# Worker

Orientation for the worker in `worker/`, which takes jobs off the Bull
queues in Redis and runs them, and for the notification pipeline that runs
in it. For anything more, read the code it points to.

## Queues and Processes

`Core` creates one Bull queue per kind of job (`QUEUES` in
`packages/backend/core.js`), since Bull can't limit concurrency per job
type within one queue:

| Queue | Job (`worker/jobs/`) | Concurrency per process |
| ----- | -------------------- | ----------------------- |
| `resize-image` | `resizeImage.js` | 1 |
| `process-video` | `processVideo.js` (ffmpeg) | 1 |
| `send-notifications` | `sendNotifications.js` | 100 |
| `add-mutuals-for-relationship`, `remove-mutuals-for-relationship` | `addMutualsForRelationship.js`, `removeMutualsForRelationship.js` | 10 |

`worker/index.js` takes a queue name on its command line and works only
that queue; with none (`general`, the default) it works every queue, which
is how it runs locally. On staging and production, each queue runs as its
own worker deployment, so a long video doesn't hold up notifications.

Adding a queue is in [Add a Worker Job](../how-to/add-a-worker-job.md).

## Things the Code Doesn't Make Obvious

- **The worker reads feature flags once, at startup.** Unlike the web
  application, it doesn't reload them, so after a flag changes the workers
  have to restart before jobs see it.
- **Every job carries `session: { user }`**, the user who caused it, so
  `JobEvents` in the web application can send its progress to that user's
  client.
- **Jobs finish by calling `done()`** or `done(error)`, and report progress
  with `job.progress({ step, stepDescription, progress })`. The work itself
  lives in a backend service, so the job file stays short.

## Notifications

Notifications are created and sent in the worker:

1. A controller calls `NotificationService.sendNotifications()` with an
   event (`PostComment:create`) and its context. That adds a
   `send-notifications` job, tried once: no notification is better than a
   duplicate.
2. `NotificationWorker` hands it to the entity's class in
   `packages/backend/services/notification/entities/`, which works out who
   should hear about it, and checks each can still see the content.
3. For each recipient it creates a notification of a full type
   (`PostComment:create:author`) from that type's definition in
   `services/notification/definitions/<Entity>/<action>/<audience>.js`,
   with its Handlebars templates for the web text and link, and the email
   (`<audience>.hbs`).
4. It's saved, sent to the user's open clients as an event, emailed and
   pushed, according to the user's `settings.notifications[type]` (`web`,
   `email`, `mobile`, `desktop`; all on by default).

Adding a type is in [Add a Notification](../how-to/add-a-notification.md).
