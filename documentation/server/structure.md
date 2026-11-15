# Server Structure

What's in `web-application/server/`, and how the server starts and stops.

**Code:** `web-application/server/`

## Files

| Path | What it does |
| ---- | ------------ |
| `bin/www` | The entry point (`npm start`). Creates the core, session parser, Express app, HTTPS server, WebSocket server and event handlers, then listens. |
| `core.js` | `createCore()`: loads and validates the configuration, then creates and initializes `Core`. |
| `config/` | The configuration files. See [Configuration](../architecture/configuration.md). |
| `app.js` | `createExpressApp()`: the middleware and routes, in order. See [Request Pipeline](request-pipeline.md). |
| `router.js` | Every API route under `/api/0.0.0`, with its rate limit and controller method. See [Routing and Rate Limits](routing-and-rate-limits.md). |
| `controllers/` | One controller per entity; `controllers/admin/` for the admin dashboard. See [Controllers](controllers.md). |
| `errors/` | `ControllerError` and its shorthands. |
| `errors.js` | The error-handling middleware, which turns errors into responses. See [Responses and Errors](responses-and-errors.md). |
| `session.js` | The session parser, with sessions stored in PostgreSQL. See [Sessions and CSRF](sessions-and-csrf.md). |
| `csrf.js` | The CSRF check. |
| `log.js` | Creates a `Logger` for each request, as `request.logger`. |
| `middleware/rateLimit.js` | Per-route, per-IP rate limits, counted in Redis. |
| `middleware/security-headers.js` | Helmet: CSP and the other security headers. See [Security Headers](security-headers.md). |
| `middleware/upload.js` | Multer middleware for image and video uploads. |
| `storage.js` | Serves files for the `filesystem` storage driver, in development. |
| `wsServer.js` | The WebSocket server at `/socket`. See [WebSockets](websockets.md). |
| `events.js` | Creates the event handlers (`NotificationEvents`, `JobEvents`). |
| `pages.js` | The page router: every non-API request gets `index.html` with its metadata. See [Pages and Metadata](pages-and-metadata.md). |
| `httpServer.js`, `certificate.js` | The HTTPS server and where its certificate comes from. |
| `views/index.html` | The template webpack builds the client's `index.html` from. |

## Starting Up

`bin/www` runs, in order:

1. `createCore('web-application')`: configuration, then `Core.initialize()`,
   which connects to PostgreSQL and Redis and creates the queues, events
   and drivers. Any failure stops the process.
2. `createSessionParser(core)`
3. `createExpressApp(core, sessionParser)`: middleware, then every
   controller, constructed once and shared by all requests.
4. `createHTTPServer(core, app)`: HTTPS only, on `PORT` (8443 by default).
5. `createWebSocketServer(core, sessionParser, server)`
6. `createEventHandlers(core)`: registers the `Job` and `Notification`
   event handlers and starts listening to the queues.

Controllers, services and DAOs are created once at startup, so they must
not keep per-request state. Anything about the request comes in through
`request`.

## Shutting Down

On `SIGTERM` or `SIGINT`, the server stops taking connections, waits for
open ones to finish, then calls `core.shutdown()`, which closes the queues,
the Redis connections and the database pool, in that order.

## HTTPS

The server only serves HTTPS. In development it uses the certificate in
`web-application/security/` (see
[Running Without Docker](../getting-started/running-without-docker.md));
with none there, as on staging and production, it makes a new self-signed
one each time it starts.
