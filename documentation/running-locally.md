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

Configuration comes from one of two sources, chosen by the `CONFIG_SOURCE`
environment variable:

- `env`: environment variables only. Nothing is read from AWS, so you don't
  need an AWS account. This is the one to use if you're contributing. It only
  works in development (`NODE_ENV=development`, which `compose.yaml` and
  `npm run dev` set); anywhere else the apps refuse to start with it.
- `ssm` (the default): AWS Systems Manager Parameter Store, under
  `/$ENVIRONMENT_NAME`. This is what staging and production use, and what
  maintainers can use locally with a `/local/<username>` path.

Each parameter has a matching environment variable: the parameter path,
uppercased, with `/` and `-` turned into `_` and a `COMMUNITIES_` prefix. For
example `/database/host` is `COMMUNITIES_DATABASE_HOST`, and
`/storage/s3/bucket-url` is `COMMUNITIES_STORAGE_S3_BUCKET_URL`. In
development, a variable that is set (and not empty) wins over the parameter,
so you can override single values while reading the rest from Parameter
Store.

Outside development, environment variables never supply configuration:
every value comes from Parameter Store, and any `COMMUNITIES_*` variables
are ignored (the apps log their names as a warning). That keeps a variable
injected into a production container from changing the configuration.

If anything is missing, the worker and web application stop at startup and
list every missing variable (or parameter) at once.

### Using environment variables (`CONFIG_SOURCE=env`)

Copy the example file to `.env` in the repository root:

```
cp .env.local.example .env
```

Then fill in the two secrets it marks, `COMMUNITIES_SESSION_SECRET` and
`COMMUNITIES_ENCRYPTION_MFA_V1_KEY`. Generate each with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The example is set up for Docker Compose, where the database and Redis are
the `postgres` and `redis` services. If you run the apps directly on your
machine instead, set `COMMUNITIES_DATABASE_HOST` and `COMMUNITIES_REDIS_HOST`
to `localhost`.

File storage, email and push notifications don't have local replacements
yet, so the example fills their values with placeholders. Both apps start,
but uploads, outgoing email and notification jobs fail until those land.

### Using Parameter Store (`CONFIG_SOURCE=ssm`)

Create a `.env` file in the repository root with AWS credentials that can read
your parameters, and the path they live under:

```
CONFIG_SOURCE=ssm
ENVIRONMENT_NAME=local/<username>
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Create every parameter the apps need under `/local/<username>`; you can copy
them from another `/local` path. To point at something different without
touching Parameter Store, add the matching `COMMUNITIES_*` variable to `.env`,
for example `COMMUNITIES_DATABASE_HOST=postgres`.

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
