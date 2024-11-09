# Running Locally

NOTE: This documentation is out of date and wrong.  If you don't have access to
Digital Ocean, you won't be able to run the local right now.  (In the push to
an open beta with limited runway, we took on some tech debt.)  If you're
interested in contributing, the first project would be getting the local
running with out dependencies on cloud infrastructure again!

After pulling the github repo, you can run the development server by first running the PostgreSQL docker
container. To run comunitiesreview, you can either use nodemon and the react dev server or build a Docker
container.

From the root project directory, run a redis docker container:

```
$ docker run -d -p 6379:6379 --name comunities-redis redis
```

From the root project directory, build the postgres docker container:

```
$ cd database
$ docker build -t comunities-sql .
```

Navigate back to the root directory and run the Postgres docker container:

```
$ cd ..
$ docker network create comunities-network
$ docker run -d -p 5432:5432 --name comunities-review-database-service --net comunities-network comunities-sql
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
