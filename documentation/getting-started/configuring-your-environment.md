# Configuring Your Environment

How to create the local configuration both apps need. How the configuration
system itself works (sources, validation, drivers) is in
[Configuration](../architecture/configuration.md).

**Code:** `web-application/server/config/`, `worker/config/`,
`.env.local.example`

## The Files

Each app has a configuration file per environment, and `NODE_ENV` picks
which one loads. The production and staging files are committed.
`index.development.js` is yours: git ignores it, and you create it from one
of the two examples next to it.

| Example | Use it when |
| ------- | ----------- |
| `index.development.js-env-example` | You're contributing. Every value comes from an environment variable, so you don't need an AWS account. |
| `index.development.js-ssm-example` | You're a maintainer with a `/local/<username>` path in Parameter Store. |

## Using Environment Variables

Create both apps' development configuration and copy the example `.env` to
the repository root:

```
cp worker/config/index.development.js-env-example worker/config/index.development.js
cp web-application/server/config/index.development.js-env-example web-application/server/config/index.development.js
cp .env.local.example .env
```

Then fill in the four secrets `.env` marks. Generate each one with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

| Variable | What it's for |
| -------- | ------------- |
| `COMMUNITIES_SESSION_SECRET` | Signs session IDs, in cookies and headers. |
| `COMMUNITIES_ENCRYPTION_MFA_V1_KEY` | Encrypts multi-factor authentication secrets. |
| `COMMUNITIES_STORAGE_FILESYSTEM_SECRET` | Signs links to locally stored files. |
| `COMMUNITIES_TEST_SECRET` | Unlocks the test endpoints the integration and end-to-end tests use. |

The example `.env` is set up for Docker Compose, where the database and
Redis are the `postgres` and `redis` services. If you run the apps directly
on your machine, set `COMMUNITIES_DATABASE_HOST` and
`COMMUNITIES_REDIS_HOST` to `localhost`.

This configuration uses local stand-ins for email, storage and push
notifications; see [Local Services](local-services.md).

## Using Parameter Store

Create both apps' development configuration from the Parameter Store
example:

```
cp worker/config/index.development.js-ssm-example worker/config/index.development.js
cp web-application/server/config/index.development.js-ssm-example web-application/server/config/index.development.js
```

Then create `.env` in the repository root with your parameter path, a log
level, and the access keys for your local environment's own IAM user:

```
COMMUNITIES_ENVIRONMENT_NAME=local/<username>
COMMUNITIES_LOG_LEVEL=debug
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

The apps read Parameter Store with these keys and nothing else: they never
fall back on a profile or login in `~/.aws`, so a local app only ever has
its environment's permissions. Copy the parameters you need under
`/local/<username>` from another `/local` path. To take one value from
somewhere else, change its source in your `index.development.js` (say
`host: 'env:COMMUNITIES_DATABASE_HOST'`) and set that variable in `.env`.

## Where `.env` Is Read

- **Docker Compose** reads `.env` from the repository root for its own
  variables and passes it to the worker and web application containers.
- **Running directly** (`npm run dev`), each app loads `.env` from its own
  folder, then from the repository root, in development only.

Variables already set in your shell win over both.

## Variable Names

Every variable is a Parameter Store path in constant case, prefixed with
`COMMUNITIES_`: `/database/host` is `COMMUNITIES_DATABASE_HOST`, and
`/storage/s3/bucket-url` is `COMMUNITIES_STORAGE_S3_BUCKET_URL`. A variable
is only used if your `index.development.js` names it with `env:`.
