# Running with Docker

How to build and run the local stack with Docker Compose. Compose runs the
web application and the worker with your source mounted into the
containers, so they reload when you change code.

**Code:** `compose.yaml`, `database/initialization-scripts/Dockerfile`,
`web-application/Dockerfile`, `worker/Dockerfile`

## 1. Build the Database Image

Compose doesn't build the database image, so build it first, from the
repository root:

```
docker build -t communities-sql database/initialization-scripts
```

The first time it starts with an empty data volume, the image creates the
`app` role and the `communities` database, sets permissions, creates the
extensions and loads the schema, the same way staging and production are
set up. Later starts keep that database. See
[Database Initialization](../database/initialization.md).

## 2. Configure

Create your development configuration and `.env`: see
[Configuring Your Environment](configuring-your-environment.md).

## 3. Install Dependencies

Use the Node version in `.nvmrc`, then install from the repository root:

```
nvm use
npm ci
```

You need this on your machine for the unit tests and your editor; the
Docker images install their own copy. See [Dependencies](../standards/dependencies.md)
for adding or changing one.

## 4. Build the Images

Both the web application and worker images build from the repository root:

```
docker compose build                       # everything
docker compose build web-application       # one service
```

Rebuild whenever `package.json` or `package-lock.json` changes, including
the version changes each release makes, and any change to an
`@communities/*` package's dependencies.

## 5. Run

```
docker compose up
```

Open `https://localhost:3000`. That's webpack's dev server, which proxies API
requests, page requests and the WebSocket to the Express server on 8443.
Changes to the client, server, worker and `packages/` reload on their own.

After a rebuild, start with `--renew-anon-volumes` (`-V`) so the containers
use the newly installed `node_modules` rather than the ones kept from the
previous containers:

```
docker compose up -V
```

## The Services

| Service | What it runs |
| ------- | ------------ |
| `postgres` | The `communities-sql` image you built, on port 5432. |
| `redis` | Redis 7, on port 6379. |
| `worker` | The worker, under nodemon, working every queue. |
| `web-application` | The Express server (8443) and the webpack dev server (3000). |

Data lasts across restarts and rebuilds; see [Local Data](local-data.md).
