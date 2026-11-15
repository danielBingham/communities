# Database Initialization

How an empty PostgreSQL server becomes a Communities database, locally and
everywhere else.

**Code:** `database/initialization-scripts/`

## The Scripts

The SQL files run in this order:

| File | What it does | Runs as | Where |
| ---- | ------------ | ------- | ----- |
| `local-database.sql` | Creates the `app` role, with the local password, and the `communities` database. | A superuser | Local only |
| `permissions.sql` | Gives the `app` role its permissions. | A superuser | Everywhere |
| `extensions.sql` | Creates the `pg_trgm` and `postgis` extensions the schema uses. | A superuser | Everywhere |
| `schema.sql` | Creates the tables: the current schema, with every migration applied. | `app` | Everywhere |

`local-database.sql` runs connected to another database on the server (such
as `postgres`), since it creates `communities`. The other three run in
`communities`. `schema.sql` runs as `app` so that `app` owns the tables and
can alter them when migrations run.

`permissions.sql` and `extensions.sql` are safe to run again; `schema.sql`
is only for an empty database.

## Locally

`initialize.sh` runs all four, connected as a superuser, switching to `app`
(`SET ROLE app`) for `schema.sql`. It's used two ways:

- **Docker:** the image built from `database/initialization-scripts/` runs
  it the first time it starts with an empty data volume. See
  [Running with Docker](../getting-started/running-with-docker.md).
- **Without Docker:** `npm run db:init`, from the repository root, runs it
  against your own server, connecting with the usual `PGHOST`, `PGPORT`,
  `PGUSER` and `PGPASSWORD`. See
  [Running Without Docker](../getting-started/running-without-docker.md).

Either way it stops without changing anything if `communities` already
exists. To start over, see [Local Data](../getting-started/local-data.md).

A local superuser can already create a database owned by `app` and switch
to it, so the `GRANT app TO postgres WITH SET TRUE` step that staging's
managed database needs isn't needed here.

## Staging

Staging is initialized with the same three shared scripts by the
[database helper image](helper-image.md). Production was initialized long
ago and is never rebuilt from `schema.sql`; if it ever had to be recovered,
it would be restored from its own snapshots and backups.

## Keeping `schema.sql` Current

`schema.sql` always describes the database with every migration applied,
and it inserts the feature flags whose migrations it already includes as
`enabled`. A change that adds a migration updates `schema.sql` in the same
change. See [Feature Flags and Migrations](../backend/feature-flags-and-migrations.md).
