FROM postgis/postgis:17-3.5-alpine

ENV POSTGRES_PASSWORD='password'

# initialize.sh runs the SQL files in order, the first time the data volume
# is created. They live outside /docker-entrypoint-initdb.d, which would run
# every .sql file there against the default database.
ENV SQL_DIRECTORY=/communities
COPY local-database.sql extensions.sql permissions.sql schema.sql /communities/
COPY initialize.sh /docker-entrypoint-initdb.d/

EXPOSE 5432
