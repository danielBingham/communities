# Running Without Docker

How to run the whole stack directly on your machine.

**Code:** `database/initialization-scripts/initialize.sh`,
`web-application/server/certificate.js`, `web-application/webpack.config.js`

## Prerequisites

- Node, at the version in `.nvmrc`.
- PostgreSQL with PostGIS, and `psql`. Production runs PostgreSQL 17 with
  PostGIS 3.5; 16 works too.
- Redis 7.
- ffmpeg, which the worker uses to process videos.

## Steps

From the repository root:

1. **Install dependencies:** `npm ci`.

2. **Create the database:**

   ```
   PGHOST=localhost PGUSER=postgres PGPASSWORD=<password> npm run db:init
   ```

   It connects as a superuser with the usual PostgreSQL environment
   variables, creates the `app` role (password `local-development`) and the
   `communities` database, and loads the schema as `app`. With Homebrew's
   PostgreSQL your own user is a superuser, so plain `npm run db:init`
   works. On Linux, make your user one first with
   `sudo -u postgres createuser --superuser $USER`. If `communities` already
   exists, it stops without changing anything. See
   [Database Initialization](../database/initialization.md).

3. **Configure both apps** with the environment-variable example (see
   [Configuring Your Environment](configuring-your-environment.md)), and set
   `COMMUNITIES_DATABASE_HOST` and `COMMUNITIES_REDIS_HOST` to `localhost`
   in `.env`.

4. **Create the HTTPS certificate:**

   ```
   mkdir -p web-application/security
   openssl req -x509 -newkey rsa:2048 -nodes -days 365 -subj "/CN=localhost" \
       -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
       -keyout web-application/security/key.pem -out web-application/security/cert.pem
   ```

   The web application only serves HTTPS. Without a certificate in
   `web-application/security`, it makes a new self-signed one each time it
   starts (as it does on staging and production), which your browser would
   never trust and the webpack dev server won't start with. Trust this one
   in your system's certificates, or the tests need
   `NODE_EXTRA_CA_CERTS=$PWD/web-application/security/cert.pem` in front of
   `npm run test:integration` or `npm run test:e2e`.

5. **Create the folders uploads are processed in:**

   ```
   mkdir -p web-application/tmp worker/tmp
   ```

6. **Start both apps:** `npm run dev`, and open `https://localhost:3000`.

## The Two Servers

`npm run dev` runs the worker and, in the web application, two servers:

| Port | Server | What it does |
| ---- | ------ | ------------ |
| 3000 | webpack's dev server | Builds and serves the client, and passes API requests, page requests and the WebSocket on to Express. Open this one. |
| 8443 | Express | The API, the WebSocket, and pages. |

Express sends every page as the `index.html` webpack builds, with the page's
title and link preview tags rendered into it, so the dev server writes its
builds to `web-application/public/dist` where Express can find them. See
[Pages and Metadata](../server/pages-and-metadata.md).
