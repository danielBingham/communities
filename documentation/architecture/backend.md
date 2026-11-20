# Backend

Orientation for `packages/backend` (`@communities/backend`), the server-side
code the web application and the worker share. For anything more, read the
code it points to.

## Where Things Are

| Path | What's there |
| ---- | ------------ |
| `core.js` | `Core`: the logger, database pool, Redis, Bull queues (`QUEUES`), events, drivers and configuration that every controller, service, DAO and job is constructed with. |
| `config.js`, `lib/aws-credentials.js` | Loading and checking configuration. See [Configuration](configuration.md). |
| `daos/` | One DAO per entity, owning its SQL. |
| `services/` | Logic beyond one entity's reads and writes: authentication, files, email, sessions, notifications. |
| `services/validation/` | Per-entity validation, behind `ValidationService`. |
| `services/permission/` | Per-entity permission classes, behind `PermissionService`. |
| `services/notification/` | Notification types, templates and delivery. See [Worker](worker.md#notifications). |
| `services/email/`, `services/storage/`, `services/push/` | The drivers. |
| `events.js`, `events/` | Publishing events on Redis, and the per-entity handlers that send them to WebSocket connections. |
| `services/FeatureService.js`, `migrations/` | The feature flag registry and the migrations that go with flags. See [Add a Feature Flag](../how-to/add-a-feature-flag.md). |
| `lib/` | Connection helpers (TLS for the database and Redis), and `ssrf-safe-fetch.js` for fetching user-supplied URLs. |
| `index.js` | Everything the package exports. |

## The Layers

Controllers (in the web application) and jobs (in the worker) orchestrate.
They call DAOs directly for straightforward reads and writes, and services
for anything more.

| Layer | Does | Doesn't |
| ----- | ---- | ------- |
| **DAOs** | SQL for an entity: selecting, hydrating rows into entities, inserting, updating. | Decide who may do what, or validate. |
| **Validation** | Whether an entity is valid: the Schema's field rules from `packages/shared`, plus rules that need the database. Returns a list of errors. | Throw for invalid input. |
| **Permissions** | Whether a user may do an action to an entity: `can(user, action, entity, context)`. | Know about HTTP. |
| **Services** | Anything spanning several DAOs, outside services or processes. | Know about HTTP. |

Every class takes `core` in its constructor and keeps no per-request state.

## Things the Code Doesn't Make Obvious

- **A DAO's `entityMaps`** declare, column by column, what may be
  inserted, updated and selected. Columns marked `select: 'request'` (a
  user's email) are only selected when code asks for them, and `'never'`
  (a password hash) not at all. A column with `needsFeature` is only read once that
  flag is on, so code for a migration can ship before the migration runs.
- **Permission rules are shared with the client.** For `Post`, `Group`,
  `GroupMember` and `GroupPost`, the permission class gathers the context
  and the rule itself is in `packages/shared/permissions/`, so the client
  can hide what a user can't do. The server's answer is the one that
  counts. See [Shared](shared.md).
- **Query visibility is in the SQL.** List endpoints don't load everything
  and filter; each controller's `createQuery()` builds the `WHERE` that
  limits results to what the user may see, and it has to agree with the
  permission rules.
- **Feature flags are read when code runs**, never in constructors, which
  run at startup.

## Tests

`npm test -w packages/backend`. See [Unit Tests](../testing/unit-tests.md).
