#!/bin/bash
#
# Initializes the Communities database on an empty PostgreSQL server, for
# local development, the same way staging and production are initialized:
#
#   1. local-database.sql  creates the `app` role and the `communities`
#                          database (local only)
#   2. permissions.sql     the `app` role's permissions
#   3. extensions.sql      pg_trgm and PostGIS, which the schema needs
#   4. schema.sql          the tables, created as `app` so it owns them
#
# It's run two ways:
#
#   - by the database image (Dockerfile here), the first time its data volume
#     is created, with POSTGRES_USER and POSTGRES_DB set by the image;
#   - by `npm run db:init`, against a PostgreSQL server you run yourself.
#     It connects with the usual libpq settings (PGHOST, PGPORT, PGUSER,
#     PGPASSWORD), as a superuser.
#
# Staging and production do step 1 by hand, with their own password, and run
# steps 2 to 4 themselves; see database/README.md.

set -e

# The SQL files are next to this script, unless SQL_DIRECTORY says otherwise
# (the image keeps them out of /docker-entrypoint-initdb.d, which would run
# every one of them against the default database).
SQL_DIRECTORY="${SQL_DIRECTORY:-$(dirname "${BASH_SOURCE[0]}")}"

# Connect as POSTGRES_USER when it's set (the image), otherwise as libpq would.
PSQL=( psql --no-psqlrc --quiet -v ON_ERROR_STOP=1 )
if [ -n "$POSTGRES_USER" ]; then
    PSQL+=( --username "$POSTGRES_USER" )
fi
ADMIN_DATABASE="${POSTGRES_DB:-postgres}"

# Don't touch a server that already has the database.
exists=$("${PSQL[@]}" --dbname "$ADMIN_DATABASE" --tuples-only --no-align \
    --command "SELECT 1 FROM pg_database WHERE datname = 'communities'")
if [ "$exists" = "1" ]; then
    echo "The communities database already exists, so there's nothing to initialize."
    echo "To start over, drop it and its role first: dropdb communities && dropuser app"
    exit 1
fi

echo 'Creating the app role and the communities database...'
"${PSQL[@]}" --dbname "$ADMIN_DATABASE" --file "$SQL_DIRECTORY/local-database.sql"

echo 'Setting permissions and creating the extensions in communities...'
"${PSQL[@]}" --dbname communities \
    --file "$SQL_DIRECTORY/permissions.sql" \
    --file "$SQL_DIRECTORY/extensions.sql"

# As `app`, so it owns the tables and can alter them when migrations run, as
# on staging and production.
echo 'Loading the schema as app...'
"${PSQL[@]}" --dbname communities \
    --command 'SET ROLE app' \
    --file "$SQL_DIRECTORY/schema.sql"

echo 'The communities database is ready.'
