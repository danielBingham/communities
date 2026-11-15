# Add a Configuration Value

How to add a setting the web application or worker reads from its
configuration. How configuration works is in
[Configuration](../architecture/configuration.md).

## 1. Name It

Choose its key in the configuration object (`thing.timeout`), and its
Parameter Store path (`/thing/timeout`). The environment variable is the
path in constant case with `COMMUNITIES_`: `COMMUNITIES_THING_TIMEOUT`.

## 2. Add It to Every Configuration File

For each app that reads it (`web-application/server/config/`,
`worker/config/`):

| File | Value |
| ---- | ----- |
| `index.production.js` | `'aws-ssm-parameter:/thing/timeout'` |
| `index.staging.js` | `'aws-ssm-parameter:/thing/timeout'` |
| `index.development.js-ssm-example` | `'aws-ssm-parameter:/thing/timeout'` |
| `index.development.js-env-example` | `'env:COMMUNITIES_THING_TIMEOUT'` |

A value that's the same everywhere and isn't secret can be written as is
instead.

## 3. Add It to `.env.local.example`

Under the right heading, with a comment saying what it is and a value that
works locally. If it's a secret, mark it like the others, so people know to
generate one.

## 4. Validate It (If It's Required)

If the app can't work without it, make startup fail clearly when it's
missing or wrong: add it to `REQUIRED` in `packages/backend/config.js` for
the `database` and `redis` blocks, or check it in the `validateConfig()` of
the driver that uses it. A value from `env:` or `aws-ssm-parameter:` that
can't be found already stops the app.

## 5. Use It

Read it from `core.config` (`this.core.config.thing.timeout`). If the
client needs it, add it to `SystemController.getInitialization()`'s
`config`, and read it from `state.system.configuration`; never send
secrets.

## 6. Tell Maintainers

Say in the pull request that it adds a value, with what it should be on
staging and production. Maintainers set it in Parameter Store before the
release that needs it. Contributors update their own `.env` and
`index.development.js` (git doesn't change those), so mention it in the
pull request description too.
