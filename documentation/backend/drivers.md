# Drivers

The pluggable implementations of email, file storage and push
notifications, chosen by configuration. What each environment uses is in
[Environments](../architecture/environments.md); the local stand-ins are in
[Local Services](../getting-started/local-services.md).

**Code:** `packages/backend/services/email/`,
`packages/backend/services/storage/`, `packages/backend/services/push/`,
`packages/backend/config.js`

## The Drivers

| Kind | Drivers | Chosen by | Created by |
| ---- | ------- | --------- | ---------- |
| Email | `postmark`, `log` | `email.driver`, with settings in `email.<driver>` | `createEmailDriver(core)`, in `Core.initialize()`, as `core.emailDriver` |
| Storage | `s3`, `filesystem` | `storage.driver`, with settings in `storage.<driver>` | `createStorage(core)`, in `Core.initialize()`, as `core.storage` |
| Push | `ios`, `android`, `log` | Each block under `notifications` turns its driver on; all that are on get every push. | `createPushDrivers(core, logger)`, by `NotificationWorker` |

## What a Driver Implements

Every driver has a static `validateConfig(settings, environment)`, which
`Config.validateConfig()` calls at startup, and which throws if a required
setting is missing or the driver isn't allowed in this environment (the
`filesystem` and `log` push drivers are development only).

| Kind | Methods |
| ---- | ------- |
| Email | `send(message)`: a Postmark-shaped message (`From`, `To`, `Subject`, `HtmlBody`, `MessageStream`). Send through `EmailService`, which builds them. |
| Storage | `uploadFile`, `uploadFileFromStream`, `uploadFileFromBuffer`, `copyFile`, `moveFile`, `hasFile`, `getFile`, `downloadFile`, `getSignedUrl`, `removeFile`, and a `contentOrigins` list (where browsers load files from, for the CSP). |
| Push | `send(userId, notification)`. |

## Notes on Each

- **`s3`** keeps files in a bucket and hands out presigned links that last
  seven days. With `endpoint` set, it works with S3-compatible servers.
- **`filesystem`** keeps files under a directory and signs links to the web
  application's `/api/0.0.0/storage/` route, which `web-application/server/storage.js`
  serves, including the range requests video playback needs.
- **`postmark`** sends through the Postmark API.
- **`log` (email)** logs each message and, with `directory`, writes it as
  JSON.
- **`ios`** keeps a connection to the Apple Push Notification service and
  sets the app's badge count; **`android`** sends through Firebase Cloud
  Messaging.
- **`log` (push)** logs each notification.

## Adding a Driver

1. Implement the same methods as the other drivers of its kind, and a
   static `validateConfig()`.
2. Add it to the kind's `index.js` factory, and to `DRIVERS` in
   `packages/backend/config.js` so its configuration is validated.
3. Export it from `packages/backend/index.js` if anything needs it by name.
4. Add tests (`packages/backend/test/services/storage.spec.js`,
   `push.spec.js` and `EmailService.spec.js` show the pattern).
5. Document its settings here and in
   [Local Services](../getting-started/local-services.md) if it's for local
   use.
