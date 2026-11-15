# Backend Structure

What's in `packages/backend` (`@communities/backend`), and how it's
layered. Both the web application and the worker are built on it.

**Code:** `packages/backend/`

## Directories

| Path | What's in it |
| ---- | ------------ |
| `core.js` | `Core`: the logger, database pool, Redis, events, queues, drivers and config every other piece receives. See [Core](core.md). |
| `config.js` | `Config`: loading and validating configuration. See [Configuration](../architecture/configuration.md). |
| `logger.js` | `Logger`. See [Errors and Logging](../standards/errors-and-logging.md). |
| `features.js` | `FeatureFlags`: the enabled features, as `core.features.has(name)`. |
| `events.js`, `events/` | `Events` and the per-entity event handlers. See [Events](events.md). |
| `daos/` | One DAO per entity (or group of tables). See [DAOs](daos.md). |
| `services/` | Logic beyond reading and writing one entity. See [Services](services.md). |
| `services/validation/` | Per-entity validation, behind `ValidationService`. See [Validation](validation.md). |
| `services/permission/` | Per-entity permissions, behind `PermissionService`. See [Permissions](permissions.md). |
| `services/notification/` | Notification types, templates and delivery. See [Notifications](../domain/notifications.md). |
| `services/email/`, `services/storage/`, `services/push/` | The pluggable drivers. See [Drivers](drivers.md). |
| `services/files/` | Image and video processing (`ImageService`, `VideoService`, `LocalFileService`). |
| `migrations/` | Migrations for feature flags; `migrations/archive/` for retired ones. See [Feature Flags and Migrations](feature-flags-and-migrations.md). |
| `errors/` | `ServiceError`, `DAOError`, `ProcessError`, `MigrationError`, `UserErrors`. |
| `lib/` | Connection helpers: `database-tls.js` and `redis-connection.js` (TLS and auth options from configuration), `ssrf-safe-fetch.js` (fetching user-supplied URLs safely), `admin.js`. |
| `test/` | Unit tests. See [Unit Tests](../testing/unit-tests.md). |
| `index.js` | Everything the package exports. |

## The Layers

```
controllers (web-application/server)        jobs (worker)
                 │                                │
                 ▼                                ▼
   services ── ValidationService ── PermissionService
       │
       ▼
     DAOs ──► PostgreSQL
```

| Layer | Responsible for | Doesn't |
| ----- | --------------- | ------- |
| **DAOs** | SQL for an entity: selecting, hydrating rows into entities, inserting, updating, deleting. | Decide who may do what, or validate. |
| **Validation** | Whether an entity is valid: the Schema's field rules, plus rules that need the database (does the referenced post exist?). | Throw for invalid input: it returns a list of errors. |
| **Permissions** | Whether a user may do an action to an entity, given its context. | Load more than the context it needs. |
| **Services** | Anything spanning several DAOs, outside services or processes: authentication, files, notifications, email, sessions. | Know about HTTP. |

Controllers and jobs sit on top and orchestrate: they call DAOs directly
for straightforward reads and writes, and services for anything more.

## Conventions

- Every class takes `core` in its constructor and keeps it as `this.core`.
- Nothing keeps per-request state: the same instances serve every request.
- Feature flags are read at call time (`this.core.features.has(name)`),
  never in constructors, since constructors run at startup.
- Export anything the web application or worker needs from `index.js`.

## Running the Tests

```
npm test -w packages/backend
```
