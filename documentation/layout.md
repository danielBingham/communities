# Repository Layout

What's where in the repository, and how the pieces depend on each other.

## The Workspace

The repository is a single npm workspace. The root `package.json` lists
five workspace packages, and one root `package-lock.json` pins every
dependency for all of them. They're all named `@communities/*`, linked
from source, and never published. npm commands name a package by its
directory: `npm test -w packages/backend`.

| Package | Directory | What it is |
| ------- | --------- | ---------- |
| `@communities/shared` | `packages/shared` | Code that runs in both the browser and Node: schemas, cleaning and validation, shared permissions, helpers. |
| `@communities/backend` | `packages/backend` | Server-side code the web application and worker share: `Core`, DAOs, services, events, migrations, drivers. |
| `@communities/session` | `packages/session` | Our fork of `express-session`, adding header-based sessions for the mobile apps. |
| `@communities/worker` | `worker` | The background job processor. |
| `@communities/web-application` | `web-application` | The Express API server and the React client it serves. |

| Package | Depends on |
| ------- | ---------- |
| `@communities/web-application` | `@communities/backend`, `@communities/session`, `@communities/shared` (the client uses it too) |
| `@communities/worker` | `@communities/backend`, `@communities/shared` |
| `@communities/backend` | `@communities/shared` |
| `@communities/shared`, `@communities/session` | No internal packages. |

## Top-Level Directories

| Path | What's in it |
| ---- | ------------ |
| `web-application/server/` | The API server: Express app, router, controllers, sessions, WebSocket server, page rendering. |
| `web-application/client/` | The React and Redux client: pages, layouts, components, state, hooks. |
| `web-application/test/` | Unit tests for the web application, the integration and end-to-end tests, and their shared library. |
| `web-application/public/` | Static files served as-is; webpack builds the client into `public/dist/`. |
| `web-application/scripts/` | `seed-storage.js`, which seeds local storage with placeholder assets. |
| `worker/` | The worker's entry point (`index.js`), its jobs (`jobs/`) and configuration (`config/`). |
| `packages/` | The three internal workspace packages above. |
| `database/` | The initialization scripts and schema (`initialization-scripts/`), and the database helper image (`Dockerfile`, `helper/`). |
| `android/`, `ios/` | The native projects for the mobile apps, generated and mostly managed by Capacitor. |
| `assets/` | Source images for the app icons and splash screens. |
| `icons/` | Web app icons generated from `assets/`. |
| `scripts/` | Repository scripts: `check-lockfile.js` (the lockfile check) and `rds-certificate-authority.js` (prints the database certificate authority for staging and production). |
| `documentation/` | This documentation. |
| `.github/workflows/` | CI (`ci.yaml`) and the Release workflow (`release.yaml`). |

## Top-Level Files

| File | What it's for |
| ---- | ------------- |
| `package.json`, `package-lock.json` | The workspace, its scripts (`npm run dev`, `npm test`, `npm run test:e2e`, ...) and its locked dependencies. |
| `compose.yaml` | The local Docker Compose stack. |
| `capacitor.config.js` | Capacitor's configuration for the mobile apps. |
| `.env.local.example` | The example `.env` for local development. |
| `.nvmrc` | The Node version. |
| `.dockerignore` | Keeps the image build context small; the images build from the repository root. |
| `LICENSE` | The GNU Affero General Public License, version 3. |

## Not in Git

| Path | What it is |
| ---- | ---------- |
| `.env` | Your local environment variables. |
| `web-application/server/config/index.development.js`, `worker/config/index.development.js` | Your local configuration. |
| `compose.override.yaml` | Your own Compose changes. |
| `local-data/` | Local file storage. |
| `web-application/public/dist/` | The client build. |
| `web-application/security/` | Your local HTTPS certificate. |
| `web-application/tmp/`, `worker/tmp/` | Scratch space for uploads, and the `log` email driver's output. |
| `web-application/test/e2e/results/` | Screenshots and traces from failed end-to-end tests. |

See [Getting Started](getting-started/README.md) for creating the ones you
need.
