# Core

`Core` holds the dependencies everything else shares, and is passed to
every controller, service, DAO and job.

**Code:** `packages/backend/core.js`, `web-application/server/core.js`,
`worker/index.js`

## What's on It

| Property | What it is |
| -------- | ---------- |
| `context` | `'web-application'` or `'worker'`. |
| `config` | The loaded configuration. See [Configuration](../architecture/configuration.md). |
| `logger` | The app's `Logger`, at the configured level. Controllers use `request.logger` instead. |
| `database` | A `pg` connection `Pool`. Query with `core.database.query(sql, params)`. |
| `redis` | A node-redis client. |
| `events` | `Events`: publish and subscribe across instances. See [Events](events.md). |
| `queues` | The Bull queues by name: `core.queues['resize-image']`. See [Background Jobs](../architecture/background-jobs.md). |
| `emailDriver` | The configured email driver. Send through `EmailService`, not directly. |
| `storage` | The configured storage driver. See [Drivers](drivers.md). |
| `features` | `FeatureFlags` for the current request: `core.features.has(name)`. Set per request by the web application's middleware. |

## Starting

```javascript
const config = await new Config(environmentName, region).loadConfig(definition)
const core = new Core('web-application', config)
await core.initialize()
```

`initialize()`:

1. Creates the logger.
2. Creates the database pool and checks it can query, logging whether the
   connection uses TLS.
3. Connects to Redis, starts `Events` (its own subscriber connection), and
   creates the Bull queues listed in `QUEUES`.
4. Creates the email and storage drivers. Push drivers are created by
   `NotificationWorker` where they're used.

If the database or Redis can't be reached as the app starts (wrong
password, a certificate that doesn't verify), `initialize()` fails and the
process stops, rather than hanging or failing every request.

## Losing Connections

- **Database:** an idle connection that drops (a restart, a failover) is
  logged and replaced the next time the pool needs one, instead of
  crashing the process.
- **Redis:** once started, node-redis reconnects with exponential backoff,
  up to 2 seconds between attempts.

## Shutting Down

`shutdown()` closes, in order: the queues (waiting for running jobs to
finish), the events subscriber and Redis client, and the database pool.
It's safe to call twice. Each app calls it on `SIGTERM` and `SIGINT`.

## Adding to Core

Add something to `Core` only if it's a connection or driver that's shared,
long-lived and needed across the app. Anything else belongs in a service.
New queues are added to `QUEUES`; see
[Add a Worker Job](../how-to/add-a-worker-job.md).
