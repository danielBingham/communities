# Errors and Logging

How errors are raised at each layer, what reaches the client, and what to
log. The client's side is in [Client Errors and Logging](../client/errors-and-logging.md).

**Code:** `web-application/server/errors/`, `web-application/server/errors.js`,
`packages/backend/errors/`, `packages/backend/logger.js`,
`web-application/server/log.js`

## The Rule

Every error has two messages: a **log message** for us, with whatever
detail helps (ids, the query, the state), and a **public message** for the
user, which says what went wrong in their terms and gives nothing away.
Only the public message and a `type` reach the client.

## Error Classes

| Class | Layer | Use it for |
| ----- | ----- | ---------- |
| `ControllerError(status, type, logMessage, publicMessage)` | Controllers | Anything the request should fail with. The error middleware turns it into the response. |
| `NotFoundError`, `NotAuthorizedError`, `NotAuthenticatedError` | Controllers | Shorthands for the 404, 403 and 401 `ControllerError`s. |
| `ServiceError(type, message)` | Services | A service can't do what was asked. Controllers catch the types they expect and turn them into `ControllerError`s. |
| `DAOError(type, message)` | DAOs | The database didn't do what was expected. |
| `ProcessError` | Services | An outside process (ffmpeg) failed; carries its stderr. |
| `MigrationError(status, message)` | Migrations | A migration failed; `status` says whether it rolled back. |
| Validation errors | Validation services, Schemas | Not thrown: returned as a list of `{ type, log, message, context }`, which controllers send with `sendUserErrors()`. |

Anything else thrown is a bug: the middleware logs it in full and sends a
500 `server-error` with a generic message.

## Which Status

| Status | Type | When |
| ------ | ---- | ---- |
| 400 | `invalid` (and more specific ones) | The input failed cleaning or validation. Send every problem at once, in `error.all`. |
| 401 | `not-authenticated` | No logged-in user, where one is needed. |
| 403 | `not-authorized` | The user can see the thing but isn't allowed to do this to it. |
| 404 | `not-found` | It doesn't exist, **or the user isn't allowed to see it.** Never 403 for something they can't see: that would tell them it exists. |
| 409 | `conflict` | It conflicts with what's there (a duplicate). |
| 429 | `too-many-requests`, `authentication-timeout` | Rate limits and login lockout. |
| 500 | `server-error` | Our bug. |

The response shapes are in [Responses and Errors](../server/responses-and-errors.md).

## Logging

Each request gets its own `Logger` as `request.logger`
(`web-application/server/log.js`), which prefixes every line with the
username (or a session or request id), the method and the URL. Use it in
controllers; use `core.logger` where there's no request.

| Level | Number | Use it for |
| ----- | ------ | ---------- |
| `critical` | 0 | The app can't continue. |
| `error` | 1 | Bugs and failures we need to look at. |
| `warn` | 2 | Something suspicious or refused: a forged request, a rate limit, a validation failure's log message. |
| `info` | 3 | The start and end of requests, startup, and 4xx errors. |
| `debug` | 4 | Detail useful when working on something. |
| `verbose` | 5 | Headers, bodies, full objects. |
| `silly` | 6 | Anything noisier. |

`COMMUNITIES_LOG_LEVEL` (the `log_level` setting) sets the most detailed
level logged. Don't log passwords, session IDs, tokens, MFA secrets or
recovery codes yourself. The request logger logs every request's headers
and body at `verbose`, and those can contain all of them, so `verbose` and
`silly` are for local development only.
