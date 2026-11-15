# Environments

The three environments the code knows about, and what changes between them.
The cloud infrastructure behind staging and production, and deploying to
them, are handled in the infrastructure repository.

**Code:** `web-application/server/config/`, `worker/config/`,
`web-application/webpack.config.js`

## The Three Environments

| | Development | Staging | Production |
| - | ----------- | ------- | ---------- |
| `NODE_ENV` | `development` | `staging` | `production` |
| Host | `https://localhost:3000` | `https://staging.communities.social` | `https://communities.social` |
| Configuration file | `index.development.js` (yours, not in git) | `index.staging.js` | `index.production.js` |
| Values come from | Environment variables (or your own Parameter Store path) | Parameter Store, `/staging/...` | Parameter Store, `/production/...` |
| Email | `log` | `postmark` | `postmark` |
| Storage | `filesystem` | `s3` | `s3` |
| Push | `log` | `ios`, `android` | `ios`, `android` |
| Versions | Whatever's checked out | Release candidates, `X.Y.Z-rc.N` | Releases, `X.Y.Z` |

## What Only Happens Outside Production

Some code paths are deliberately limited to development and staging:

| What | Where it's checked |
| ---- | ------------------ |
| The test endpoints (`POST /test/user`, `DELETE /test/user/:id`), and only with a `test.secret` configured. | `web-application/server/router.js`, `TestController` |
| The `test` platform, which uses header sessions like the apps. | `packages/session/index.js` |
| Skipping rate limits for the `test` platform. | `web-application/server/middleware/rateLimit.js` |
| The `log` push driver and the `filesystem` storage driver (development only). | Each driver's `validateConfig()` |

And some only happen in production: Sentry error reporting in the client
(`web-application/client/index.js`), and the integration and end-to-end
tests refusing to run against it.

## How the Environment Is Chosen

- **Server side:** `NODE_ENV` picks the configuration file (see
  [Configuration](configuration.md)), and `COMMUNITIES_ENVIRONMENT_NAME`
  gives the Parameter Store path prefix.
- **Client:** the bundle is built for one environment. Webpack reads
  `NODE_ENV` at build time and writes the host, API path, environment and
  version into `<meta>` tags in `index.html` (`communities-host`,
  `communities-environment`, ...), which the client reads at startup. The
  root scripts `npm run build`, `npm run build-staging` and
  `npm run build-dev` build for each. The WebSocket host comes from the
  server's configuration, which the client gets when it initializes.

## Mobile App Variants

The iOS and Android apps have a variant per environment (iOS schemes and
bundle IDs, Android flavors), so production, staging and local builds can
be installed side by side. See [Mobile](../mobile/README.md).
