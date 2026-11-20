# Configuration

How the web application and worker get their configuration: one file per
app per environment, which declares where every value comes from, loaded
and checked before the app starts. Setting up your own is in
[Configuring Your Environment](../getting-started/configuring-your-environment.md);
adding a value is in
[Add a Configuration Value](../how-to/add-a-configuration-value.md).

**Code:** `packages/backend/config.js`, `packages/backend/lib/aws-credentials.js`,
`web-application/server/config/`, `worker/config/`

## The Files

Each app has a `config/` directory with `index.production.js`,
`index.staging.js`, and two development examples. `NODE_ENV` picks the
file. In development, `config/index.js` first loads `.env` from the app's
folder and the repository root.

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

The app won't start with a value missing or a setting a driver rejects.
It stops and lists every problem, with the key and where it looked.

## Drivers

Email, storage and push notifications are pluggable: the `driver` setting
in the `email` and `storage` blocks picks one, and its settings are the
block with the same name. The `notifications` block turns on a push driver
per block it has. Which each environment uses is in
[Environments](environments.md); the local stand-ins are in
[Local Services](../getting-started/local-services.md).

## AWS Credentials

Parameter Store and the `s3` storage driver use the same AWS credentials,
so each environment reaches AWS as one identity:

- **Locally**, only the access keys in `AWS_ACCESS_KEY_ID` and
  `AWS_SECRET_ACCESS_KEY`: those of your local environment's own IAM user.
  The apps never fall back on a profile or login in `~/.aws`, so a local
  app has its environment's permissions, never yours.
- **On staging and production**, the pods' EKS Pod Identity. There are no
  keys.

A `storage.s3` block with its own `access_id` and `access_key` uses those
instead, for an S3-compatible server. Which parameters exist, and who can
read them, is handled in the infrastructure repository.
