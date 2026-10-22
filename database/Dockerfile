# communities-database-helper
#
# Initializes the Communities database on staging and production, and runs
# other one-off database tasks, from inside the cluster. The infrastructure
# runs it as a Kubernetes Job and picks the task with the command:
#
#   initialize-database             Create the app role and the communities
#                                   database, and load the schema (see
#                                   helper/initialize-database).
#   promote-superadmin USERNAME     Give a registered account the superadmin
#                                   site role.
#
# Both read the database settings from Parameter Store under
# /$COMMUNITIES_ENVIRONMENT_NAME, using the AWS credentials in the
# environment (see helper/database-settings.sh).
#
# Built and pushed by the Release workflow, tagged with the release version
# like the web-application and worker images, so a release's schema always
# travels with its code. Build it from this directory:
#
#   docker build -t communities-database-helper:[version] database

# psql comes from the PostgreSQL image. Keep the major version in step with
# the Aurora engine (16).
FROM postgres:16-bookworm

# The AWS CLI v2, to read the settings from Parameter Store.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl unzip \
    && curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/aws /tmp/awscliv2.zip \
    && apt-get purge -y --auto-remove curl unzip \
    && rm -rf /var/lib/apt/lists/*

# The same layout as in the repository, so the helper scripts find the SQL
# files the same way in both places.
COPY initialization-scripts/permissions.sql \
     initialization-scripts/extensions.sql \
     initialization-scripts/schema.sql \
     /opt/communities/database/initialization-scripts/
COPY helper/ /opt/communities/database/helper/

ENV PATH="/opt/communities/database/helper:${PATH}" \
    AWS_PAGER=""

# Run as the image's unprivileged postgres user (uid 999); nothing here needs
# root. Numeric, so Kubernetes can enforce runAsNonRoot if it's ever required.
USER 999:999
WORKDIR /var/lib/postgresql

# This image runs one task and exits, never the PostgreSQL server, so drop
# the base image's entrypoint. Without a command, it lists the tasks.
ENTRYPOINT []
CMD ["bash", "-c", "echo 'communities-database-helper: run initialize-database, or promote-superadmin USERNAME.' >&2; exit 64"]
