#!/bin/bash
#
# Loads the connection settings for the Communities database, and keeps the
# helper away from production. Sourced by initialize-database and
# promote-superadmin; not run on its own.
#
# These scripts are for staging, and for trying the image against a scratch
# database locally. Production's database was initialized long ago and is
# only ever restored from its own snapshots and backups, so nothing here may
# touch it. Three checks stand in the way, each enough on its own:
#
#   1. COMMUNITIES_ENVIRONMENT_NAME must be one of ALLOWED_ENVIRONMENTS
#      (staging, local). It's required, and "production" isn't allowed.
#   2. The database host has to belong to that environment: for staging it
#      must contain "staging", for local it must be a local address. A host
#      containing "production" is always refused.
#   3. An existing `communities` database is only touched if it carries this
#      environment's marker, the database comment
#      "communities-environment=<environment>". initialize-database writes it
#      when it creates the database, and nothing else does, so production's
#      database never has one. See check_database_environment.
#
# load_database_settings sets and exports:
#
#   PGHOST, PGPORT        The database server.
#   PGUSER, PGPASSWORD    The master user (Aurora's master user on staging, a
#                         superuser locally).
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
# To point at a database directly instead, for example a scratch one, set
# PGHOST, PGPORT, PGUSER, PGPASSWORD and APP_PASSWORD yourself. When PGHOST is
# set, Parameter Store isn't read at all. The checks above still apply.

ALLOWED_ENVIRONMENTS=( staging local )

# Hosts a local database can be reached at, from the host or a container.
LOCAL_HOSTS=( localhost 127.0.0.1 ::1 host.docker.internal postgres )

refuse() {
    echo "Refusing to continue: $*" >&2
    exit 1
}

# parameter NAME: prints /$COMMUNITIES_ENVIRONMENT_NAME/NAME from Parameter Store.
parameter() {
    local name="/$COMMUNITIES_ENVIRONMENT_NAME/$1"
    if ! aws ssm get-parameter --name "$name" --with-decryption \
            --query Parameter.Value --output text; then
        echo "Couldn't read $name from Parameter Store." >&2
        return 1
    fi
}

# Check 1: an environment these scripts are allowed to run for.
check_environment_name() {
    local environment="${COMMUNITIES_ENVIRONMENT_NAME:-}" allowed
    if [ -z "$environment" ]; then
        refuse "set COMMUNITIES_ENVIRONMENT_NAME to the environment to work on (${ALLOWED_ENVIRONMENTS[*]})."
    fi
    for allowed in "${ALLOWED_ENVIRONMENTS[@]}"; do
        if [ "$environment" = "$allowed" ]; then
            return 0
        fi
    done
    refuse "COMMUNITIES_ENVIRONMENT_NAME is '$environment', and these scripts only run for: ${ALLOWED_ENVIRONMENTS[*]}. They must never run against production."
}

# Check 2: a host that belongs to the environment.
check_host() {
    local host lowered local_host
    host="$PGHOST"
    lowered="$(printf '%s' "$host" | tr '[:upper:]' '[:lower:]')"

    case "$lowered" in
        *production*)
            refuse "the database host '$host' looks like production."
            ;;
    esac

    case "$COMMUNITIES_ENVIRONMENT_NAME" in
        staging)
            case "$lowered" in
                *staging*) return 0 ;;
            esac
            refuse "the database host '$host' isn't a staging host (its name doesn't contain 'staging')."
            ;;
        local)
            for local_host in "${LOCAL_HOSTS[@]}"; do
                if [ "$lowered" = "$local_host" ]; then
                    return 0
                fi
            done
            refuse "the database host '$host' isn't local (${LOCAL_HOSTS[*]}), and COMMUNITIES_ENVIRONMENT_NAME is 'local'."
            ;;
    esac
}

load_database_settings() {
    check_environment_name

    if [ -n "${PGHOST:-}" ]; then
        : "${PGPORT:=5432}"
        : "${PGUSER:?PGHOST is set, so PGUSER must be set too}"
        : "${PGPASSWORD:?PGHOST is set, so PGPASSWORD must be set too}"
        : "${APP_PASSWORD:?PGHOST is set, so APP_PASSWORD must be set too}"
        echo "Using the database settings from the environment ($PGHOST)."
    else
        export AWS_PAGER=""

        echo "Reading the database settings from Parameter Store under /$COMMUNITIES_ENVIRONMENT_NAME..."
        PGHOST="$(parameter database/host)"
        PGPORT="$(parameter database/port)"
        PGUSER="$(parameter database/root-user)"
        PGPASSWORD="$(parameter database/root-password)"
        APP_PASSWORD="$(parameter database/password)"
    fi

    export PGHOST PGPORT PGUSER PGPASSWORD APP_PASSWORD
    check_host
}

# The marker initialize-database puts on the databases it creates.
database_marker() {
    printf 'communities-environment=%s' "$COMMUNITIES_ENVIRONMENT_NAME"
}

# Check 3: run before changing anything on the server. Prints "absent" when
# there's no `communities` database yet, or "marked" when it carries this
# environment's marker. Refuses for any other database, which includes
# production's.
check_database_environment() {
    local found
    # "database:<comment>" when the database exists, nothing when it doesn't.
    if ! found=$(psql --no-psqlrc --quiet -v ON_ERROR_STOP=1 --dbname postgres \
            --tuples-only --no-align --command \
            "SELECT 'database:' || coalesce(shobj_description(oid, 'pg_database'), '')
             FROM pg_database WHERE datname = 'communities'"); then
        echo "Couldn't connect to $PGHOST to check which database it is." >&2
        exit 1
    fi

    if [ -z "$found" ]; then
        echo "absent"
    elif [ "$found" = "database:$(database_marker)" ]; then
        echo "marked"
    else
        refuse "the communities database on $PGHOST isn't marked as a $COMMUNITIES_ENVIRONMENT_NAME database (its comment is '${found#database:}'). These scripts only change databases initialize-database created, so they can never change production's. If this really is a $COMMUNITIES_ENVIRONMENT_NAME database that was set up another way, mark it once, as its owner:
  COMMENT ON DATABASE communities IS '$(database_marker)';"
    fi
}
