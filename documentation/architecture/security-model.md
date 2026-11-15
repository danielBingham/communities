# Security Model

The layers of defense in the platform, and where each lives. The rules for
writing code that keeps them intact are in
[Security Standards](../standards/security.md).

## Transport

| Layer | Where |
| ----- | ----- |
| **HTTPS only.** The server never listens on plain HTTP. Without a certificate in `web-application/security/` (as on staging and production), it makes a new self-signed one each time it starts. | `web-application/server/httpServer.js`, `web-application/server/certificate.js` |
| **TLS to the database and Redis** on staging and production (`verify-full`, with the certificate authorities from configuration). | `packages/backend/lib/database-tls.js`, `lib/redis-connection.js` |

## Who's Asking

| Layer | Where |
| ----- | ----- |
| **Sessions** are stored in PostgreSQL. Browsers carry the session ID in a signed cookie; the apps carry it in the `X-Communities-Auth` header and keep it in the device's secure storage. | `web-application/server/session.js`, `packages/session/` |
| **Passwords** are hashed with bcrypt. Ten failed logins in fifteen minutes locks an account out for fifteen minutes. Failures don't say whether the email exists. | `packages/backend/services/AuthenticationService.js` |
| **Multi-factor authentication** with TOTP and single-use recovery codes. TOTP secrets are encrypted at rest with versioned keys; recovery codes are hashed. | `packages/backend/services/MultifactorAuthenticationService.js`, `packages/backend/services/EncryptionService.js` |
| **Session regeneration** on login and registration, so a session ID from before can't be reused. | `packages/backend/services/SessionService.js` |

## Is the Request Genuine

| Layer | Where |
| ----- | ----- |
| **CSRF tokens.** Each session has a token, sent to the client on initialization and required in `X-Communities-CSRF-Token` on every request but `GET`, compared in constant time. | `web-application/server/csrf.js` |
| **CORS** allows only the site's own host and the apps' origins, the four methods the API uses, and the headers it needs. | `web-application/server/app.js` |
| **Rate limits** on every route, per IP address, counted in Redis. | `web-application/server/middleware/rateLimit.js` |

## What They Can Do

| Layer | Where |
| ----- | ----- |
| **Cleaning and validation** of every input: bodies and route parameters are cleaned (trimmed, unknown properties dropped) and validated before use. | Schemas in `packages/shared`, `ValidationService` |
| **Permission checks** before any read or write, through `PermissionService.can()`. The client uses the same rules only to shape the UI. | `packages/backend/services/permission/`, `packages/shared/permissions/` |
| **Not leaking existence.** Things a user can't see answer 404, the same as things that don't exist. | Controllers |
| **Parameterized SQL** everywhere. | DAOs |

## What Comes Back

| Layer | Where |
| ----- | ----- |
| **Content Security Policy** and other security headers, with every directive listed explicitly. | `web-application/server/middleware/security-headers.js` |
| **Error messages** split into a log message (server only) and a public message, so internals don't reach the client. | `ControllerError`, `web-application/server/errors.js` |
| **Signed file links.** Files are only reachable through signed, expiring links (S3, or the filesystem driver's equivalent). | `packages/backend/services/storage/` |

## Outbound Requests

| Layer | Where |
| ----- | ----- |
| **SSRF protection.** Fetching a link for its preview resolves the host and refuses private addresses, at connection time. | `packages/backend/lib/ssrf-safe-fetch.js` |

## Keeping Test Code Off Production

The test endpoints, the `test` platform, and the rate-limit exemption only
exist in development and staging, and the endpoints also need a secret.
The test suites refuse to run against production. See
[Environments](environments.md).
