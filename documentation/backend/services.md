# Services

The services in `packages/backend/services`: what each is for, and the
conventions they share. Validation and permissions have their own pages
([Validation](validation.md), [Permissions](permissions.md)).

**Code:** `packages/backend/services/`

## Conventions

- A class, constructed with `core`, creating the DAOs and other services it
  uses. No per-request state: the current user is passed in.
- Returns data, or throws `ServiceError(type, message)` for a failure the
  caller should handle. Controllers catch the types they expect and turn
  them into `ControllerError`s.
- Knows nothing about HTTP: no `request` or `response`.
- Exported from `packages/backend/index.js`.

A controller uses a service when the work spans several DAOs, talks to
something outside the database, or is shared with the worker. A
straightforward read or write goes to the DAO directly.

## Catalog

| Service | For |
| ------- | --- |
| `AuthenticationService` | Hashing and checking passwords (bcrypt), and checking credentials with lockout after repeated failures. |
| `MultifactorAuthenticationService` | TOTP enrollment and verification, and recovery codes. |
| `EncryptionService` | Encrypting and decrypting with versioned keys from `encryption` in the configuration (MFA secrets). |
| `SessionService` | Regenerating sessions, and finding or deleting a user's sessions (on password change, banning). |
| `TokenService` | CSRF tokens, and single-use tokens for email confirmation, password reset and invitations. |
| `UserService` | Registering users and inviting them. |
| `UserRelationshipService` | A user's friend and block ids, used to build visibility queries. |
| `MutualsService` | Mutual friends: reading them, and updating them when a friendship starts or ends (used by the worker's mutuals jobs). |
| `GroupService` | Group hierarchy (a group's parent ids, for subgroups). |
| `GroupMemberService` | Inviting members to groups. |
| `EmailService` | Building and sending emails (confirmation, password reset, invitations, notifications) through the email driver. |
| `NotificationService` | Queuing notifications: adds a `send-notifications` job. |
| `NotificationWorker` (`notification/`) | Creating and delivering notifications, in the worker. See [Notifications](../domain/notifications.md). |
| `FileService` | File paths and variants in storage, and whether a file is still in use. |
| `ImageService`, `VideoService`, `LocalFileService` (`files/`) | Resizing images, processing video with ffmpeg, and working with local temporary files. |
| `ProcessService` | Running an outside process (ffmpeg) and collecting its output. |
| `LinkPreviewService` | Fetching a page safely and building its link preview. See [Link Previews](../domain/link-previews.md). |
| `NewsService` | The News posts, kept as JSON in storage. See [News and About Pages](../domain/news-and-about-pages.md). |
| `PageMetadataService` | Each page's title and link preview tags. See [Pages and Metadata](../server/pages-and-metadata.md). |
| `FeatureService` | Feature flags and running their migrations. See [Feature Flags and Migrations](feature-flags-and-migrations.md). |
| `ValidationService` | Validating entities. See [Validation](validation.md). |
| `PermissionService` | Checking what a user may do. See [Permissions](permissions.md). |

`WebSocketService` and `EventService` are exported but not used; WebSocket
connections and events go through `Events` (see [Events](events.md)).

## Adding a Service

1. Create `services/<Name>Service.js`, a class taking `core`.
2. Give each public method a JSDoc block, and throw `ServiceError` with a
   specific `type` for each failure a caller might handle.
3. Export it from `packages/backend/index.js`.
4. Add unit tests in `packages/backend/test/services/`, with a mocked
   `core.database`.
5. Add it to the table above.
