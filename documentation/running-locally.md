# Running Locally

Communities local development environment uses Docker Compose with volume and
entrypoint overrides to allow for hot-reloading during development.

The compose environment currently does *not* build the database image, so you
will need to build and run that image before you can run the
environment.

## Initializing the Database

From the root project directory, build the postgres docker container:

```
$ docker build -t communities-sql database/initialization-scripts
```

## Configuring the Local Environment

Each app has a configuration file per environment, and `NODE_ENV` picks
which one is loaded:

| `NODE_ENV`    | worker                                | web application                                       |
| ------------- | ------------------------------------- | ----------------------------------------------------- |
| `production`  | `worker/config/index.production.js`   | `web-application/server/config/index.production.js`   |
| `staging`     | `worker/config/index.staging.js`      | `web-application/server/config/index.staging.js`      |
| `development` | `worker/config/index.development.js`  | `web-application/server/config/index.development.js`  |

The file declares where every value comes from, and nothing else decides it:

- `'aws-ssm-parameter:/database/host'` reads AWS Systems Manager Parameter
  Store at `/$COMMUNITIES_ENVIRONMENT_NAME/database/host`.
- `'env:COMMUNITIES_DATABASE_HOST'` reads that environment variable.
- Any other string is used as written.

A value only comes from the environment if the file says `env:` for it, so
there are no implicit overrides. If any value can't be found, the app stops
at startup and lists every missing one, with the key and where it looked.

The production and staging files are committed. `index.development.js` is
yours: git ignores it, and you create it by copying one of the two examples
next to it, then edit it however you need.

- `index.development.js-env-example` reads every value from an environment
  variable, so you don't need an AWS account. Use this one if you're
  contributing.
- `index.development.js-ssm-example` reads from Parameter Store, like
  production. Maintainers can use it with a `/local/<username>` path.

Environment variable names follow one scheme: the Parameter Store path in
constant case, prefixed with `COMMUNITIES_`. `/database/host` is
`COMMUNITIES_DATABASE_HOST`, and `/storage/s3/bucket-url` is
`COMMUNITIES_STORAGE_S3_BUCKET_URL`.

### Using environment variables

Create the development configuration for both apps from the environment
variable example, and copy the example `.env` to the repository root:

```
cp worker/config/index.development.js-env-example worker/config/index.development.js
cp web-application/server/config/index.development.js-env-example web-application/server/config/index.development.js
cp .env.local.example .env
```

Then fill in the two secrets `.env` marks, `COMMUNITIES_SESSION_SECRET` and
`COMMUNITIES_ENCRYPTION_MFA_V1_KEY`. Generate each with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The example `.env` is set up for Docker Compose, where the database and Redis
are the `postgres` and `redis` services. If you run the apps directly on your
machine instead, set `COMMUNITIES_DATABASE_HOST` and `COMMUNITIES_REDIS_HOST`
to `localhost`.

The example configuration uses the `log` email driver, so nothing is sent:
each email (account confirmation, password reset, invitations and so on) is
logged with its links, and saved as JSON under each app's `tmp/email`
folder. See [Email](#email) below.

File storage and push notifications don't have local replacements yet, so the
example fills their values with placeholders. Both apps start, but uploads
and notification jobs fail until those land.

### Using Parameter Store

Create the development configuration for both apps from the Parameter Store
example:

```
cp worker/config/index.development.js-ssm-example worker/config/index.development.js
cp web-application/server/config/index.development.js-ssm-example web-application/server/config/index.development.js
```

Then create a `.env` file in the repository root with the path your
parameters live under, a log level, and AWS credentials that can read them:

```
COMMUNITIES_ENVIRONMENT_NAME=local/<username>
COMMUNITIES_LOG_LEVEL=debug
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Create every parameter the apps need under `/local/<username>`; you can copy
them from another `/local` path. To take a single value from somewhere else,
change its source in your `index.development.js`, for example
`host: 'env:COMMUNITIES_DATABASE_HOST'`, and set that variable in `.env`.

### Email

The `email` block in each configuration file picks how email is sent.
`driver` names the driver, and the block with the same name holds that
driver's settings:

```
email: {
    driver: 'postmark',
    postmark: {
        api_token: 'aws-ssm-parameter:/postmark/api-token'
    }
}
```

- `postmark` sends through the Postmark API with `api_token`. Production and
  staging use it, and so does the Parameter Store example.
- `log` sends nothing. It logs each message with its recipient, subject and
  links, and if `directory` is set, writes the whole message there as a JSON
  file (a relative directory is relative to the app's folder). The
  environment-variable example uses it with `directory: 'tmp/email'`.

### Where `.env` is read

Docker Compose reads `.env` from the repository root for its own variables
and passes it to the worker and web-application containers. When you run the
apps directly (`npm run dev`), each app loads `.env` from its own folder and
then from the repository root, in development only. Variables already set in
your shell win over both.

## Installing Dependencies

The repository is a single npm workspace: the root `package.json` lists the
workspace packages (`packages/shared`, `packages/backend`, `packages/session`,
`worker` and `web-application`), and one root `package-lock.json` pins every
dependency. Dependencies come from the public npm registry; no registry
credentials are needed. The internal `@communities/*` packages are linked from
source and are never downloaded from a registry.

Use the Node version in `.nvmrc` (with [nvm](https://github.com/nvm-sh/nvm),
run `nvm use`), then install from the repository root:

```
npm ci
```

You need this on your machine to run the unit tests (`npm test`) or for your
editor; the Docker images install their own copy.

When you add or change a dependency, run `npm install` from the repository root
(for example `npm install <package> -w packages/backend`) so the root lockfile
is updated, and check it before committing:

```
npm run check:lockfile
```

The check fails if the lockfile resolves anything from a registry other than
registry.npmjs.org, is missing an integrity hash, or resolves an internal
`@communities/*` package from anywhere but the workspace. If you normally
install through a mirror, override it for this repository with
`--registry=https://registry.npmjs.org/`.

## Building the Environment

Before you run the environment, or after changes to `package.json` or
`package-lock.json` (including the version changes made by the release
pipeline), you will need to build the environment. Both images build from the
repository root.

To build the whole environment:

```
docker compose build
```

To build individual containers:

```
docker compose build web-application
```

To refresh the environment after a version increment:

```
docker compose build web-application worker
```

After a rebuild, start with `--renew-anon-volumes` (`-V`) so the containers
pick up the newly installed `node_modules` in the workspace packages rather
than the ones kept from the previous containers:

```
docker compose up -V
```

## Running the Environment

Once you have your environment initialized and build, you can bring it up using `up`:

```
docker compose up
```

From there, it should automatically reload and recompile with any code changes.
If you make any dependency changes (anything requiring `npm install`) you will
need to rebuild the environment.  That includes changes to any of the
`@communities` package dependencies.  See "Building the Environment".
