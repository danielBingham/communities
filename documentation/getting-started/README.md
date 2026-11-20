# Getting Started

How to run Communities on your own machine. The local stack is the web
application (API server and React client), the worker, PostgreSQL and Redis,
with stand-ins for email, file storage and push notifications so you don't
need any outside services or cloud accounts.

## The Quickest Path

With Docker:

1. Install Node at the version in `.nvmrc` (`nvm use`) and Docker.
2. [Configure your environment](configuring-your-environment.md) with the
   environment-variable example and a `.env`.
3. [Build and start the stack](running-with-docker.md): build the database
   image, `npm ci`, `docker compose build`, `docker compose up`.
4. Open `https://localhost:3000` and [create your first
   account](your-first-account.md).

Without Docker, you need PostgreSQL with PostGIS, Redis and ffmpeg on your
machine; see [Running Without Docker](running-without-docker.md).

## In This Directory

| File | Read it when |
| ---- | ------------ |
| [running-with-docker.md](running-with-docker.md) | Setting up and running the stack with Docker Compose, or rebuilding it after dependencies change. |
| [configuring-your-environment.md](configuring-your-environment.md) | Creating your `index.development.js` files and `.env`, or wondering where a setting comes from. |
| [local-services.md](local-services.md) | Finding the emails the app "sent", where uploads go, or using an S3-compatible server locally. |
| [running-without-docker.md](running-without-docker.md) | Running PostgreSQL, Redis and the apps directly on your machine. |
| [local-data.md](local-data.md) | Starting over with an empty database, or keeping your data in a folder of your own. |
| [your-first-account.md](your-first-account.md) | Registering locally, making yourself an admin, and using the admin dashboard. |
| [running-the-mobile-apps.md](running-the-mobile-apps.md) | Building and running the iOS and Android apps against your local stack or another environment. |

## Next

- [Testing](../testing/README.md): running the unit, integration and
  end-to-end tests against your local stack.
- [Repository Layout](../layout.md) and the
  [System Overview](../architecture/overview.md): where everything is, and
  how it fits together.
