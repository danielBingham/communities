FROM postgis/postgis:17-3.5-alpine

ENV POSTGRES_PASSWORD='password'

ADD permissions.sql /
ADD schema.sql /

ADD initialize.sh /docker-entrypoint-initdb.d

EXPOSE 5432 
