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

The local environment depends on parameters pull from AWS Parameter Store.  You
will need to initialize it with a `.env` file setting the AWS credentials
allowing it to pull the parameters.  You will also need to create all the
required parameters on a path unique to your environment in parameter store.
You can use a path prefixed `/local/<username>` to set your parameters.

**TODO** *This section is currently a stub.  Until this section is completed,
you can examine the parameters on other `/local` paths in order to populate
your environment's parameters.*

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
