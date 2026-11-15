# Client Errors and Logging

How the client handles errors and logs, and how its logs reach the server.
The server's side is in [Errors and Logging](../standards/errors-and-logging.md).

**Code:** `web-application/client/logger.js`,
`web-application/client/errors/`, `web-application/client/lib/errors/`,
`web-application/client/components/errors/`, `web-application/client/index.js`

## Logging

`logger` (`import logger from '/logger'`) is a singleton with the same
levels as the server's: `critical`, `error`, `warn`, `info`, `debug`,
`verbose`, `silly`.

- It logs to the console, prefixed with the time and level.
- **It forwards each log at or above its level to the server**: the
  logger dispatches it to the `system` slice, which sends it to
  `POST /system/log`. The server writes it to its own log under the user's
  name. Logs from users who aren't logged in are dropped.
- The level comes from the server's configuration on initialization
  (`logger.setLevel(configuration.log_level)`).

Use `logger` rather than `console`, so problems in people's browsers and
apps reach us. Don't log what you wouldn't want in the server's logs.

## Request Errors

Failed requests don't throw: their result carries the error (see
[Requests](requests.md)). Components check `request.state === 'failed'`
and show it, usually with `RequestError` from `components/errors/`, which
shows a 404 page for a 404 and each message in `error.all` otherwise.

`createError(type, message)` (`lib/errors/`) makes an error of the same
shape for errors the client finds itself (a file that's too large).

## Render Errors

- **`ErrorBoundary`** (`errors/ErrorBoundary.js`) wraps the whole app in
  `App.js`: an error while rendering shows an error page rather than a blank
  screen, and is logged.
- **`ComponentErrorBoundary`** (`components/errors/`) wraps a part of a
  page that can fail on its own, so one broken component doesn't take down
  the page. So far only the admin dashboard uses it.

## Other Error Components

| Component | For |
| --------- | --- |
| `Error404` | Something doesn't exist, or the user can't see it. |
| `ErrorCard`, `ErrorModal`, `WarningModal` | Showing an error or warning inline or in a modal. |
| `JobError` | A file's processing job failed. |

## Sentry

In production, `index.js` starts Sentry, which reports errors with source
maps uploaded at build time (`sentryWebpackPlugin`, with
`SENTRY_AUTH_TOKEN`). It's off in development and staging.
