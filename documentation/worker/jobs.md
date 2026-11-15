# Jobs

Each job the worker runs: what adds it, what it's given, and what it does.

**Code:** `worker/jobs/`, `packages/backend/services/`

## How a Job Is Written

Each file in `worker/jobs/` exports a function that takes `core` and
returns the processor Bull calls for each job:

```javascript
module.exports = function(core) {
    return async function(job, done) {
        try {
            job.progress({ step: 'initializing', stepDescription: 'Initializing...', progress: 0 })
            // ... the work, through backend services and DAOs ...
            job.progress({ step: 'complete', stepDescription: 'Complete!', progress: 100 })
            done(null)
        } catch (error) {
            core.logger.error(error)
            done(error)
        }
    }
}
```

- The job's data is in `job.data`. Every job carries `session: { user }`,
  the user who caused it, so progress can go back to them.
- The work itself lives in a backend service, so the job file stays short.
- Progress is `{ step, stepDescription, progress }`, `progress` from 0 to
  100. `JobEvents` sends it to the user's client.
- `done(null)` on success, `done(error)` on failure. A failure is logged
  and, for files, marks the file `error` so the client can say so.

## The Jobs

| Queue | File | Added by | Data | Does |
| ----- | ---- | -------- | ---- | ---- |
| `resize-image` | `resizeImage.js` | `FileController` after an image upload; `VideoService` for a video's poster | `{ session, fileId }`, with `attempts: 3` | Resizes the image to each of `ImageService`'s widths (30, 200, 325, 450 and 650 pixels) in storage, then marks the file `ready`. |
| `process-video` | `processVideo.js` | `FileController` after a video upload | `{ session, fileId }` | Runs ffmpeg through `VideoService` to transcode the video, reporting its progress as it goes, makes the poster image (by adding a `resize-image` job), and marks the file `ready`. |
| `send-notifications` | `sendNotifications.js` | `NotificationService.sendNotifications()`, from controllers | `{ session, type, context, options }` | Hands the notification to `NotificationWorker`, which works out who gets it, saves it, publishes a `Notification:create` event, and sends email and push according to each user's settings. See [Notifications](../domain/notifications.md). |
| `add-mutuals-for-relationship` | `addMutualsForRelationship.js` | `UserRelationshipController` when a friendship is confirmed | `{ session, relationship }` | `MutualsService.addMutualsForRelationship()`. Skipped unless `fix-495-slow-friends-list` is enabled. |
| `remove-mutuals-for-relationship` | `removeMutualsForRelationship.js` | `UserRelationshipController` when a friendship ends | `{ session, relationship }` | `MutualsService.removeMutualsForRelationship()`. Skipped unless `fix-495-slow-friends-list` is enabled. |

The file states and the upload flow are in
[Files and Media](../domain/files-and-media.md); mutual friends are in
[Relationships](../domain/relationships.md).

## Adding a Job

See [Add a Worker Job](../how-to/add-a-worker-job.md).
