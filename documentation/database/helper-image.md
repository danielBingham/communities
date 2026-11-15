# The Database Helper Image

The `communities-database-helper` image runs database tasks for staging from
inside the cluster, where the private database is reachable. How and when
it's run on staging is handled in the infrastructure repository; this page
covers what the image does and the checks that keep it off production.

**Code:** `database/Dockerfile`, `database/helper/`

## What's in It

The image is based on the `postgres` image (for `psql`) and adds the AWS
CLI, the three shared SQL files (`permissions.sql`, `extensions.sql`,
`schema.sql`) and the scripts in `database/helper/`. It never contains
`local-database.sql` or `initialize.sh`, which stay local-only.

| Command | What it does |
| ------- | ------------ |
| `initialize-database` | Creates the `app` role and the `communities` database (marked as belonging to the environment), then runs `permissions.sql` and `extensions.sql` as the master user and `schema.sql` as `app`, in one transaction. Safe to run again: it checks each step, and only sets the `app` password on a database that's already initialized. |
| `promote-superadmin USERNAME` | Gives a registered account the `superadmin` site role. Fails if no account has that username. |

Both read their settings from Parameter Store under
`/$COMMUNITIES_ENVIRONMENT_NAME/database/`, the same parameters the web
application reads: `host`, `port`, `root-user`, `root-password` and
`password`. The AWS CLI uses the
credentials the container has: access keys in `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY`, or the pod's identity.

The Release workflow builds the image and tags it with the release version
alongside the web application and worker images, so a release's schema
always matches its code.

## Never Production

The helper refuses to run against production, with three checks before it
changes anything, each enough on its own (see
`database/helper/database-settings.sh`):

1. `COMMUNITIES_ENVIRONMENT_NAME` is required and must be `staging` or
   `local`.
2. The database host has to belong to that environment: a `staging` host
   name must contain `staging`, and a `local` one must be a local address
   (`localhost`, `127.0.0.1`, `::1`, `host.docker.internal`, `postgres`). A
   host name containing `production` is always refused.
3. An existing `communities` database is only touched if its comment is the
   environment's marker, `communities-environment=staging` (or `=local`).
   `initialize-database` writes it when it creates the database, and nothing
   else does, so production's database never has it.

A staging database set up some other way is refused too. If it really is
staging's, mark it once, as `app`:

```
COMMENT ON DATABASE communities IS 'communities-environment=staging';
```

## Trying It Locally

Build it from the repository root:

```
docker build -t communities-database-helper database
```

Point it at a database directly by setting `PGHOST`, `PGPORT`, `PGUSER`,
`PGPASSWORD` and `APP_PASSWORD`, with `COMMUNITIES_ENVIRONMENT_NAME=local`;
Parameter Store isn't read when `PGHOST` is set. Use a scratch server: the
database from `compose.yaml` was set up by `initialize.sh`, has no marker,
and so is left alone.

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

The scripts also run straight from `database/helper/` with `psql` and the
AWS CLI installed.
