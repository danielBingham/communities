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

## Staging and production

The infrastructure repository documents initializing them ("Initializing the
Database"). They create the `app` role, with their own password, and the
`communities` database by hand instead of running `local-database.sql`, then
run the other three files from this folder: `permissions.sql` and
`extensions.sql` as the master user, and `schema.sql` as `app`.

## Restoring a dump

`Dockerfile` and `initialize_from_dump.sh` in this folder build an image from a
dump in `test-data/`, which isn't in the repository.
