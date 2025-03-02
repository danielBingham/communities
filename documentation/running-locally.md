# Running Locally

After pulling the github repo, you can run the development server by first
running the PostgreSQL docker container. To run comunities, you can either use
nodemon and the react dev server or build a Docker container.

## Running on Host with NPM

From the root project directory, run a redis docker container:

```
$ docker run -d -p 6379:6379 --name comunities-redis redis:7.0.10
```

From the root project directory, build the postgres docker container:

```
$ docker build -t comunities-sql database/initialization-scripts 
```

Run the Postgres docker container:

```
$ docker run -d -p 5432:5432 --name comunities-sql comunities-sql
```

Once the redis and SQL containers are running, you'll need to NPM install the
web-application and the backend, and link the backend, before running.

From the repo root:

```
$ (cd packages/backend && npm install && npm link)
$ (cd web-application && npm install && npm link @communities/backend)
```

You'll need to copy your secrets into a `.env` file under `web-application`.
Create `web-application/.env` and copy in the secrets:

```
HOST=https://localhost:3000/

LOG_LEVEL=debug

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password

REDIS_HOST=localhost
REDIS_PORT=6379

SESSION_SECRET=hot-dev

S3_BUCKET_URL=[Your bucket URL here]
S3_BUCKET=[Your bucket here]
S3_ACCESS_ID=<SECRET>
S3_ACCESS_KEY=<SECRET>

POSTMARK_API_TOKEN=<SECRET>

```

Next confirm that the docker containers are running cleanly, then you can run
the local from the repo root:

```
$ docker ps
CONTAINER ID   IMAGE             COMMAND                  CREATED        STATUS         PORTS                                       NAMES
2f805c5f8619   communities-sql   "docker-entrypoint.s…"   8 weeks ago    Up 3 minutes   0.0.0.0:5432->5432/tcp, :::5432->5432/tcp   communities-sql
28958af88849   redis:7.0.10      "docker-entrypoint.s…"   2 months ago   Up 7 days      0.0.0.0:6379->6379/tcp, :::6379->6379/tcp   communities-redis

$ npm run dev --prefix=web-application
```

## Running everything in Docker [UnTested]

From the root project directory, run a redis docker container:

```
$ docker run -d -p 6379:6379 --name comunities-redis redis
```

From the root project directory, build the postgres docker container:

```
$ docker build -t comunities-sql database/initialization-scripts 
```

Navigate back to the root directory and run the Postgres docker container:

```
$ cd ..
$ docker network create comunities-network
$ docker run -d -p 5432:5432 --name comunities-sql --net comunities-network comunities-sql
```

Run `npm install` for the worker. From the root directory:

```
$ cd worker
$ npm install
```

Run the worker in development mode. From the root directory:

```
$ cd worker
$ npm run dev
```

Run `npm install` for the web application to install project dependencies. From the root directory:

```
$ cd web-application
$ npm install
```

Run the development server for react and node to allow hot reloading while you develop. From the root directory:

```
$ cd web-application
$ npm run dev
```

When you're ready to test your project in a more production like context, kill the development
server and build the app docker container.

From the root project directory:

```
$ docker build -t comunities .
$ docker run -d -p 8080:8080 --name comunities --net comunities-network comunities 
```

When you're done, make sure to clean up the two docker containers:

```
$ docker stop comunities
$ docker stop comunities-sql
$ docker rm comunities
$ docker rm comunities-sql
```
