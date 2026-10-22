#!/bin/bash
#
# Loads the connection settings for the Communities database. Sourced by
# initialize-database and promote-superadmin; not run on its own.
#
# load_database_settings sets and exports:
#
#   PGHOST, PGPORT        The database server.
#   PGUSER, PGPASSWORD    The master user (Aurora's master user on staging and
#                         production, a superuser locally).
#   APP_PASSWORD          The password for the `app` role.
#
# They come from AWS Systems Manager Parameter Store under
# /$COMMUNITIES_ENVIRONMENT_NAME, the same parameters the web application and
# workers read:
#
#   database/host, database/port                 PGHOST, PGPORT
#   database/root-user, database/root-password   PGUSER, PGPASSWORD
#   database/password                            APP_PASSWORD
#
# Reading them needs AWS credentials that can read those parameters, from
# the usual places (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, a profile,
# an instance role), and AWS_REGION.
#
# To point at a database directly instead, for example a local one, set
# PGHOST, PGPORT, PGUSER, PGPASSWORD and APP_PASSWORD yourself. When PGHOST is
# set, Parameter Store isn't read at all.

# parameter NAME: prints /$COMMUNITIES_ENVIRONMENT_NAME/NAME from Parameter Store.
parameter() {
    local name="/$COMMUNITIES_ENVIRONMENT_NAME/$1"
    if ! aws ssm get-parameter --name "$name" --with-decryption \
            --query Parameter.Value --output text; then
        echo "Couldn't read $name from Parameter Store." >&2
        return 1
    fi
}

load_database_settings() {
    if [ -n "${PGHOST:-}" ]; then
        : "${PGPORT:=5432}"
        : "${PGUSER:?PGHOST is set, so PGUSER must be set too}"
        : "${PGPASSWORD:?PGHOST is set, so PGPASSWORD must be set too}"
        : "${APP_PASSWORD:?PGHOST is set, so APP_PASSWORD must be set too}"
        echo "Using the database settings from the environment ($PGHOST)."
    else
        : "${COMMUNITIES_ENVIRONMENT_NAME:?Set COMMUNITIES_ENVIRONMENT_NAME to read the database settings from Parameter Store, or set PGHOST, PGPORT, PGUSER, PGPASSWORD and APP_PASSWORD}"
        export AWS_PAGER=""

        echo "Reading the database settings from Parameter Store under /$COMMUNITIES_ENVIRONMENT_NAME..."
        PGHOST="$(parameter database/host)"
        PGPORT="$(parameter database/port)"
        PGUSER="$(parameter database/root-user)"
        PGPASSWORD="$(parameter database/root-password)"
        APP_PASSWORD="$(parameter database/password)"
    fi

    export PGHOST PGPORT PGUSER PGPASSWORD APP_PASSWORD
}
