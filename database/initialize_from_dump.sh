#!/bin/bash

set -e

# Create the user and the database from the default database so that we can give the user ownership of the database.
psql -a -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE app WITH LOGIN PASSWORD 'local-development';

    CREATE DATABASE communities OWNER app;
EOSQL

echo 'Setting permissions...'
psql -a -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "communities" --file="/permissions.sql"

psql -a -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "communities" < /dump.sql
