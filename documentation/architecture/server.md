# Server

Orientation for the Express API server in `web-application/server/`: where
things are, the conventions every endpoint follows, and how sessions work.
For anything more, read the code it points to.

## Where Things Are

| Path | What's there |
| ---- | ------------ |
| `bin/www` | The entry point: creates the core, the Express app, the HTTPS server, the WebSocket server and the event handlers. |
| `app.js` | Every middleware, in order, then the API router, static files and the page router. |
| `router.js` | Every API route under `/api/0.0.0`, each with its rate limit and controller method. |
| `controllers/` | One controller per entity; `controllers/admin/` for the admin dashboard. |
| `errors/`, `errors.js` | `ControllerError`, and the middleware that turns errors into responses. |
| `session.js`, `csrf.js` | Sessions and the CSRF check. |
| `wsServer.js`, `events.js` | The WebSocket server at `/socket`, and the handlers that send events down it. |
| `pages.js` | Every non-API request gets the client's `index.html`, with the page's title and link preview tags rendered in. |
| `config/` | The configuration files. See [Configuration](configuration.md). |

Controllers, services and DAOs are created once at startup and shared by
every request, so they keep no per-request state. Feature flags are loaded
per request onto the shared `core`, so read them inside a request
(`this.core.features.has(name)`), never in a constructor.

## Endpoints

Controller methods follow the same sequence: check the feature flag,
authenticate, clean and validate the input, load what the request is
about, check permissions, write, read back, respond.
`CommentReactionController.js` is a compact example of every step.

- **Permissions** go through `PermissionService.can()` (see
  [Backend](backend.md)). Something the user may not see answers 404
  `not-found`, exactly as if it didn't exist. Something they can see but
  may not act on answers 403 `not-authorized`.
- **Errors** are thrown as
  `ControllerError(status, type, logMessage, publicMessage)`. Only the
  public message reaches the client.
- **Rate limits** are set per route in `router.js`, per IP address, counted
  in Redis.

## Response Shapes

A single entity, from a `GET`, `POST`, `PATCH` or `DELETE` (a `DELETE`
returns what it deleted):

```json
{ "entity": { "id": "…" }, "relations": { "users": { "<id>": { } } } }
```

A query, paged with `?page=N`:

```json
{
    "dictionary": { "<id>": { } },
    "list": [ "<id>" ],
    "meta": { "count": 135, "page": 1, "pageSize": 20, "numberOfPages": 7 },
    "relations": { }
}
```

`relations` holds other entities the client needs, keyed by the client
slice's name in camelCase plural (`users`, `postComments`, `files`), so the
client can store them without asking again.

An error, with validation errors listed in `all`:

```json
{ "error": { "type": "not-found", "message": "That resource doesn't exist." } }
{ "error": { "type": "invalid", "all": [ { "type": "content:too-long", "message": "…" } ] } }
```

## Sessions

Sessions are stored in PostgreSQL (`connect-pg-simple`), so any instance can
serve any request. The platform header, `X-Communities-Platform`, decides
where the session ID travels:

| Platform | Session ID in |
| -------- | ------------- |
| `web`, or none | A signed cookie. |
| `ios`, `android` | The `X-Communities-Auth` header, both ways, because cookies don't work reliably in the apps' WebViews. The apps keep it in secure storage. |
| `test` (development and staging only) | The header, as for the apps. The tests' API helpers use it. |

Header sessions come from `packages/session`, our fork of
`express-session` 1.18.2. Its `README.md` is upstream's; what we changed is
the `headerName` and `platformHeader` options, and the branches in
`index.js` that read and write the ID by platform. To take a fix from
upstream, diff upstream's release against 1.18.2, apply it keeping those
branches, and run `npm test -w packages/session`.

The WebSocket can't send headers, so the client packs the platform and auth
headers into `Sec-WebSocket-Protocol`, and `wsServer.js` unpacks them
before checking the session.

## CSRF

`GET /system/initialization` gives the client the session's CSRF token,
along with the enabled features and the client's configuration. The client
sends it in `X-Communities-CSRF-Token` on everything but a `GET`. A wrong
or missing token is a 403 `invalid-csrf`; a session that's lost its token
is a 401 `session-expired`, and the client initializes again.
