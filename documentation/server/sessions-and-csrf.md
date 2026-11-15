# Sessions and CSRF

How the server knows who's asking, for browsers and for the apps, and how
it checks a request came from our client.

**Code:** `web-application/server/session.js`, `web-application/server/csrf.js`,
`packages/backend/services/SessionService.js`,
`web-application/server/controllers/SystemController.js`, `packages/session/`

## Sessions

Sessions are stored in PostgreSQL, in the `session` table that
`connect-pg-simple` creates if it's missing, so any instance of the web
application can serve any request. The parser is our fork of
express-session (see [The Session Package](session-package.md)), set up in
`session.js`:

| Setting | Value |
| ------- | ----- |
| Lifetime | 30 days. |
| Cookie | `httpOnly`, `secure`, `sameSite: none`, named by `session.cookieName`. |
| Created | For every API request (`saveUninitialized`), so the CSRF token has somewhere to live before login. |
| Signed with | `session.secret`. |

The current user is `request.session.user`, set when they log in or
register. Anything else per-session (the CSRF token, the platform) lives on
`request.session` too.

## Cookies or Headers

The platform header (`X-Communities-Platform` by default, set by
`session.platformHeader`) decides where the session ID travels:

| Platform | Session ID in |
| -------- | ------------- |
| `web`, or none | A cookie. |
| `ios`, `android` | The `X-Communities-Auth` header (`session.headerName`), in both directions. The apps keep it in the device's secure storage. |
| `test` (development and staging only) | The header, as for the apps. The integration and end-to-end tests' API helpers use it. |

Cookies don't work reliably in the apps' WebViews, which is why the apps
use the header. The WebSocket can't send headers at all, so both are
smuggled into the upgrade request; see [WebSockets](websockets.md).

## Logging In and Out

`SessionService.regenerateSession(request)` gives the session a new ID
whenever the user's identity changes (logging in, registering), so a
session ID from before can't be reused. Logging out destroys the session.
The flows themselves are in [Authentication](../domain/authentication.md).

## CSRF

1. **The client initializes.** `GET /system/initialization` creates a CSRF
   token in the session if it doesn't have one (`TokenService.createCSRFToken()`)
   and returns it as `csrf`, along with the server's version, the client's
   configuration (`wsHost`, log level, contribution links) and the enabled
   features.
2. **The client sends it** in `X-Communities-CSRF-Token` on every request
   but `GET`.
3. **`csrf.js` checks it** against the session's token, in constant time:

| Problem | Response |
| ------- | -------- |
| The session has no token (it expired, or was destroyed) | 401 `session-expired` |
| No token in the request, or the wrong one | 403 `invalid-csrf` |

A new session means a new token, so after logging out (or a session
expiring), the client initializes again.

## Who's Logged In

`GET /authentication` returns the current session's user, which is how
the client learns whether it's logged in when it starts.
