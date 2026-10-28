# Database

`initialization-scripts/` sets up the Communities database on an empty
PostgreSQL server. The SQL files run in this order:

| File                 | What it does                                                    | Runs as        | Where       |
| -------------------- | --------------------------------------------------------------- | -------------- | ----------- |
| `local-database.sql` | Creates the `app` role, with the local password, and the `communities` database | A superuser | Local only |
| `permissions.sql`    | Gives the `app` role its permissions                            | A superuser    | Everywhere  |
| `extensions.sql`     | Creates the `pg_trgm` and `postgis` extensions the schema uses  | A superuser    | Everywhere  |
| `schema.sql`         | Creates the tables: the current schema, every migration applied | `app`          | Everywhere  |

`local-database.sql` runs connected to another database on the server (such
as `postgres`), since it creates `communities`. The other three run in
`communities`. `schema.sql` runs as `app` so that `app` owns the tables and
can alter them when migrations run.

`permissions.sql` and `extensions.sql` are safe to run again; `schema.sql` is
for an empty database.

## Locally

`initialize.sh` runs all four, connected as a superuser; it switches to `app`
(`SET ROLE app`) for `schema.sql`. A superuser can already create a database
owned by `app` and switch to it, so the `GRANT app TO postgres WITH SET TRUE`
step that staging needs on Aurora, whose master user isn't a full superuser,
isn't needed here. It's used two ways:

- **Docker:** the image in `initialization-scripts/` runs it the first time
  it starts with an empty data volume (see
  [Running Locally](../documentation/running-locally.md#initializing-the-database)).
- **Without Docker:** `npm run db:init`, from the repository root, runs it
  against your own PostgreSQL server, connecting with the usual `PGHOST`,
  `PGPORT`, `PGUSER` and `PGPASSWORD` (see
  [Running Without Docker](../documentation/running-locally.md#running-without-docker)).

Either way it stops without changing anything if `communities` already
exists. To start over: `dropdb communities && dropuser app`.

## Staging: the database helper image

`Dockerfile` here builds `communities-database-helper`, which runs database
tasks for staging from inside the cluster, where the private database is
reachable. It's based on the `postgres` image (for `psql`) and adds the AWS
CLI, the three shared SQL files and the scripts in `helper/`:

| Command                       | What it does |
| ----------------------------- | ------------ |
| `initialize-database`         | Creates the `app` role and the `communities` database (marked as belonging to the environment), then runs `permissions.sql` and `extensions.sql` as the master user and `schema.sql` as `app`, in one transaction. Safe to run again: it checks each step, and only sets the `app` password on a database that's already initialized. |
| `promote-superadmin USERNAME` | Gives a registered account the superadmin site role. Fails if no account has that username. |

The infrastructure runs the image as a Kubernetes Job and picks the task with
the container's command. It never touches `local-database.sql` or
`initialize.sh`, which stay local-only.

Both commands read their settings from Parameter Store under
`/$COMMUNITIES_ENVIRONMENT_NAME`, the same parameters the web application
reads: `database/host`, `database/port`, `database/root-user`,
`database/root-password` and `database/password`. The Job passes the same
AWS keys and environment name the web application uses, so whatever reads
the app's configuration has to be able to read the root credentials too.

The Release workflow builds and pushes the image to ECR as
`communities/database-helper`, tagged with the release version alongside
`communities/web-application` and `communities/worker`. A release's schema
therefore always matches its code.

### Never production

Production's database was initialized long ago. If it ever has to be
recovered, it's restored from its own snapshots and backups, not rebuilt from
`schema.sql`. So the helper refuses to run against it, with three checks
before it changes anything, each enough on its own (see
`helper/database-settings.sh`):

1. `COMMUNITIES_ENVIRONMENT_NAME` is required and must be `staging` or
   `local`.
2. The database host has to belong to that environment: a `staging` host
   name must contain `staging`, a `local` one must be a local address
   (`localhost`, `127.0.0.1`, `::1`, `host.docker.internal`, `postgres`). A
   host name containing `production` is always refused.
3. An existing `communities` database is only touched if its comment is the
   environment's marker, `communities-environment=staging` (or `=local`).
   `initialize-database` writes it when it creates the database, and nothing
   else does, so production's database never has it. Even with every other
   setting pointing at production, the helper stops there, before it so much
   as sets a password.

A staging database set up some other way (by hand, before this image
existed) is refused too. If it really is staging's, mark it once, as `app`:

```
COMMENT ON DATABASE communities IS 'communities-environment=staging';
```

### Trying it locally

Build it from the repository root:

```
docker build -t communities-database-helper database
```

Point it at a database directly by setting `PGHOST`, `PGPORT`, `PGUSER`,
`PGPASSWORD` and `APP_PASSWORD`, with `COMMUNITIES_ENVIRONMENT_NAME=local`;
Parameter Store isn't read when `PGHOST` is set. Use a scratch server: the
database from `compose.yaml` was set up by `initialize.sh` and has no marker,
so the helper leaves it alone. For example:

```
docker run --rm -d --name communities-scratch-database \
  -e POSTGRES_PASSWORD=password -p 5433:5432 postgis/postgis:16-3.5

docker run --rm --add-host=host.docker.internal:host-gateway \
  -e COMMUNITIES_ENVIRONMENT_NAME=local \
  -e PGHOST=host.docker.internal -e PGPORT=5433 \
  -e PGUSER=postgres -e PGPASSWORD=password -e APP_PASSWORD=scratch \
  communities-database-helper initialize-database

docker stop communities-scratch-database
```

The scripts also run straight from `helper/` with `psql` and the AWS CLI
installed: `database/helper/initialize-database`.
