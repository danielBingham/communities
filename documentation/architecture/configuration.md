# Configuration

How the web application and worker get their configuration: one file per
app per environment, which declares where every value comes from, loaded
and validated before the app starts. Setting up your own local
configuration is in
[Configuring Your Environment](../getting-started/configuring-your-environment.md).

**Code:** `packages/backend/config.js`, `web-application/server/config/`,
`worker/config/`, `web-application/server/core.js`

## The Files

Each app has a `config/` directory with `index.production.js`,
`index.staging.js`, and two development examples. `NODE_ENV` picks the file
(`Config.definitionFor()`), checked against a fixed list so it can't name
any other file. In development, `config/index.js` first loads `.env` from
the app's folder and the repository root.

The file is a plain object with the same shape the app sees as
`core.config`. Every value is one of:

| Value | Loaded from |
| ----- | ----------- |
| `'aws-ssm-parameter:/database/host'` | Parameter Store, at `/$COMMUNITIES_ENVIRONMENT_NAME/database/host`. |
| `'env:COMMUNITIES_DATABASE_HOST'` | That environment variable. |
| Anything else | Used as written. |

Nothing else decides a value: there are no implicit overrides from the
environment. Environment variables are named after the Parameter Store
path, in constant case, prefixed with `COMMUNITIES_`.

## The Blocks

| Block | What it holds |
| ----- | ------------- |
| `host`, `wsHost` | Where browsers reach the app and its WebSocket. |
| `environment`, `log_level` | The environment's name and the log level. |
| `database` | `host`, `port`, `user`, `password`, `name`, and TLS (`ssl`, `certificateAuthorities`). |
| `redis` | `host`, `port`, and TLS and auth (`tls`, `auth`, `password`). |
| `session` | `cookieName`, `headerName`, `platformHeader`, `secret`. |
| `encryption` | Versioned keys and parameters, such as `encryption.mfa.v1`. |
| `storage` | `driver` and that driver's block (`s3` or `filesystem`). |
| `email` | `driver` and that driver's block (`postmark` or `log`). |
| `notifications` | One block per push driver to turn on (`ios`, `android`, `log`). |
| `test` | `secret`, for the test endpoints. Development and staging only. |
| `stripe` | Contribution links. |

## Loading and Validation

At startup (`createCore()` in `web-application/server/core.js`, and the
same in the worker):

1. `Config.loadConfig()` walks the definition and loads every value from its
   source. Anything it can't find is collected, and the app stops with a
   list of every missing value, its key, and where it looked.
2. `Config.validateConfig()` checks what was loaded: the `database` and
   `redis` blocks have their required settings, each driver the
   configuration selects exists, and each driver's own `validateConfig()`
   accepts its settings. Problems stop the app, listed together.
3. `new Core(context, config)` and `core.initialize()` connect to
   everything. See [Core](../backend/core.md).

## AWS Credentials

Parameter Store is only contacted if the definition has
`aws-ssm-parameter:` values. Locally, the apps use only the access keys in
`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, never a profile or login
from `~/.aws`, so a local app has its environment's permissions and never
yours. On staging and production the pods have their own identity
(`Config.awsCredentials()`). Which parameters exist, and who can read them,
is handled in the infrastructure repository.

## Adding a Value

See [Add a Configuration Value](../how-to/add-a-configuration-value.md).
