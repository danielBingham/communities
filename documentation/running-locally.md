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

The first time it starts with an empty data volume, the image creates the
`app` role and the `communities` database, sets permissions, creates the
extensions and loads the schema, the same way staging and production are set
up. Later starts keep that database; [Local Data](#local-data) covers
starting over. See [the database README](../database/README.md).

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

It then checks what it loaded: the `database` and `redis` settings, the
email, storage and push drivers the file selects, and the settings each of
those drivers needs. Any problems stop it at startup too, listed together.

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

Then fill in the four secrets `.env` marks, `COMMUNITIES_SESSION_SECRET`,
`COMMUNITIES_ENCRYPTION_MFA_V1_KEY`, `COMMUNITIES_STORAGE_FILESYSTEM_SECRET` and
`COMMUNITIES_TEST_SECRET` (the integration tests' secret). Generate each with:

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

It also uses the `filesystem` storage driver, so uploaded images and videos
are kept in `local-data/storage` at the repository root and served by the
web application. See [Storage](#storage) below.

And it uses the `log` push driver, so push notifications are logged instead
of sent to phones. See [Push notifications](#push-notifications) below.

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

### Storage

The `storage` block picks where uploaded files (images, videos and their
variants) are kept, the same way: `driver` names the driver, and the block
with the same name holds its settings.

```
storage: {
    driver: 's3',
    s3: {
        bucket_url: 'aws-ssm-parameter:/storage/s3/bucket-url',
        bucket: 'aws-ssm-parameter:/storage/s3/bucket',
        access_id: 'aws-ssm-parameter:/storage/s3/access-id',
        access_key: 'aws-ssm-parameter:/storage/s3/access-key'
    }
}
```

- `s3` keeps files in an S3 bucket, and browsers load them from signed S3
  links. Production and staging use it, and so does the Parameter Store
  example.
- `filesystem` keeps each file under `directory` and signs links to the web
  application's `/api/0.0.0/storage/` route with `secret`. The
  environment-variable example uses it with `directory:
  '../local-data/storage'`; a relative directory is relative to the app's
  folder, so both apps use `local-data/storage` at the repository root, which
  Docker Compose mounts into both containers. It can only be used in
  development.

The `s3` driver also works with an S3-compatible server such as
[Garage](https://garagehq.deuxfleurs.fr/) or
[SeaweedFS](https://github.com/seaweedfs/seaweedfs), if you'd rather test
against the S3 code path. Add `endpoint` (the server's S3 API, for example
`'http://localhost:3900'`), and `region` if the server expects one other than
`us-east-1`. If the apps reach the server at a different address than your
browser does (a container hostname, say), set `public_endpoint` to the one
your browser uses; signed links are made with it. Buckets on a custom
endpoint are addressed by path.

Two assets the web application serves come from storage too:
`assets/intro-video.mp4` (the welcome notice's video) and
`assets/daniel-headshot.jpg`. To give new local storage placeholder copies,
run this from the repository root:

```
npm run storage:seed
```

It only adds files that aren't there, so it never replaces real ones.

The posts on the News page (`/about/news`) are kept in storage as well, all
together in one JSON file, `news/index.json`, keyed by each post's slug. New
local storage doesn't have one, so the News page starts out empty. Log in as
a site admin (`site_role` 'admin' or 'superadmin') and use the New Post
button at the top of the admin menu (`/admin`) to write one, or copy an
`index.json` into `local-data/storage/news/`.

### Push notifications

The `notifications` block works differently from email and storage: each
block inside it turns on the driver with the same name, and every driver
that's on gets each push notification.

```
notifications: {
    ios: {
        privateCert: 'aws-ssm-parameter:/notifications/ios/apns-private-key-pem',
        publicCert: 'aws-ssm-parameter:/notifications/ios/apns-public-cert-pem',
        applicationBundleID: 'aws-ssm-parameter:/notifications/ios/application-bundle-id',
        endpoint: 'aws-ssm-parameter:/notifications/ios/endpoint'
    },
    android: {
        firebaseServiceAccount: 'aws-ssm-parameter:/notifications/android/firebase-service-account-json'
    }
}
```

- `ios` sends to the iOS app through the Apple Push Notification service.
- `android` sends to the Android app through Firebase Cloud Messaging.
- `log` sends nothing. It logs each notification with its type, recipient,
  text and link. It can only be used in development.

Production, staging and the Parameter Store example use `ios` and `android`.
The environment-variable example uses `log: {}`. An empty or missing
`notifications` block turns push notifications off. Either way, notifications
still appear in the app and are emailed; the block only decides where pushes
to phones go.

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

## Local Data

Compose keeps the database and Redis's data in two volumes that Docker
manages, `communities_postgres-data` and `communities_redis-data`. They last
across `docker compose down`, rebuilds and `docker compose up -V`, which only
renews the containers' anonymous `node_modules` volumes.

To start over with an empty database, delete its volume while the stack is
down; the next `docker compose up` initializes a new one:

```
docker compose down
docker volume rm communities_postgres-data
```

`docker compose down -v` deletes both volumes at once. Uploaded files are
kept in the repository's `local-data/storage` folder instead (see
[Storage](#storage)).

### Keeping the Data in a Folder

To keep the data in a folder of your own instead, such as one from before
Compose used volumes, add a `compose.override.yaml` next to `compose.yaml`.
Compose reads it automatically, and git ignores it. A mount there for the same
path in the container replaces the volume:

```yaml
services:
  postgres:
    volumes:
      - /path/to/communities-sql:/var/lib/postgresql/data
  redis:
    volumes:
      - /path/to/communities-redis:/data
```

## Running Without Docker

You can also run everything directly on your machine. You'll need:

- Node, the version in `.nvmrc`;
- PostgreSQL with PostGIS, and `psql` (production runs PostgreSQL 17 with
  PostGIS 3.5; 16 works too);
- Redis 7;
- ffmpeg, which the worker uses to process videos.

Then, from the repository root:

1. Install the dependencies with `npm ci` (see
   [Installing Dependencies](#installing-dependencies)).

2. Create the database:

   ```
   npm run db:init
   ```

   It creates the `app` role (password `local-development`) and the
   `communities` database, sets permissions, creates the extensions and loads
   the schema, the same way the database image does. It connects with the usual
   PostgreSQL environment variables, as a superuser, and loads the schema as
   `app` so that `app` owns the tables:

   ```
   PGHOST=localhost PGUSER=postgres PGPASSWORD=<password> npm run db:init
   ```

   With Homebrew's PostgreSQL your own user is a superuser, so plain
   `npm run db:init` works. On Linux, where usually only `postgres` is, make
   your user one first with `sudo -u postgres createuser --superuser $USER`.
   If `communities` already exists, it stops without changing anything.

3. Configure both apps as in
   [Using environment variables](#using-environment-variables), and set
   `COMMUNITIES_DATABASE_HOST` and `COMMUNITIES_REDIS_HOST` to `localhost` in
   `.env`.

4. Create the HTTPS certificate the web application serves
   `https://localhost:3000` with:

   ```
   mkdir -p web-application/security
   openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=localhost" \
       -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
       -keyout web-application/security/key.pem -out web-application/security/cert.pem
   ```

   Your browser warns about it until you trust it. The integration and
   end-to-end tests need it trusted too: add it to your system's
   certificates, or run them with
   `NODE_EXTRA_CA_CERTS=$PWD/web-application/security/cert.pem npm run test:integration`
   (or `test:e2e`).

5. Create the folders the apps process uploads in:

   ```
   mkdir -p web-application/tmp worker/tmp
   ```

6. Start both apps:

   ```
   npm run dev
   ```

   and open `https://localhost:3000`.

   That's webpack's dev server, which serves the client's bundles and passes
   API and page requests on to the web application's Express server on
   `https://localhost:8080`. Express sends every page as the `index.html`
   webpack builds, with the page's title and link preview tags rendered into
   it (view the source of a News post to see them), so the dev server writes
   its builds to `web-application/public/dist`.

## Running the Integration Tests

With the environment running, run the tests from your machine:

```
npm run test:integration
```

Each run creates the users it logs in as and deletes them at the end, with
the `COMMUNITIES_TEST_SECRET` from your `.env`, so there's nothing else to set
up. See
[the integration test README](../web-application/test/integration/README.md)
for how to run against staging, and
[the shared test library's README](../web-application/test/lib/README.md) for
how the users are created.

## Running the End-to-End Tests

The end-to-end tests drive the site in a browser with Playwright. Install
Playwright's Chromium once, from `web-application`:

```
npx playwright install chromium
```

Then, with the environment running (the worker too), run them from your
machine:

```
npm run test:e2e
```

They create and delete their users the same way the integration tests do.
See [the end-to-end test README](../web-application/test/e2e/README.md) for
watching them run, debugging failures and running against staging.
