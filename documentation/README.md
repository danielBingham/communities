# Communities Documentation

The documentation for the Communities platform: how to run it, how it's
built, the standards we follow, and how to make common changes. Each
directory has its own index; start here, go to the directory you need, and
read only the file you need.

## Start Here

1. [Getting Started](getting-started/README.md): run the platform locally.
2. [System Overview](architecture/overview.md): the pieces and how they fit.
3. [Repository Layout](layout.md): what's where.
4. [Glossary](glossary.md): the terms used in the code and these docs.
5. [Definition of Done](standards/definition-of-done.md): what a change
   includes.

## Directories

| Directory | What's in it |
| --------- | ------------ |
| [getting-started/](getting-started/README.md) | Setting up and running the platform on your machine. |
| [architecture/](architecture/README.md) | How the pieces work together: requests, events, jobs, configuration, security. |
| [standards/](standards/README.md) | The rules that apply across the codebase: style, naming, errors, security, dependencies, git. |
| [server/](server/README.md) | The Express API server: pipeline, routing, controllers, responses, sessions, WebSockets, pages. |
| [backend/](backend/README.md) | The shared backend package: `Core`, DAOs, services, validation, permissions, events, migrations, drivers. |
| [shared/](shared/README.md) | Code the client and server share: schemas, validation, permission rules, helpers. |
| [worker/](worker/README.md) | The worker and its jobs. |
| [database/](database/README.md) | The data model, schema conventions, initialization and the helper image. |
| [testing/](testing/README.md) | Unit, integration, end-to-end and manual tests: running and writing them. |
| [api/](api/README.md) | The API reference (being rewritten). |

## Find It by Task

| I want to... | Read |
| ------------ | ---- |
| Run the platform locally | [getting-started/README.md](getting-started/README.md) |
| Configure my local environment | [getting-started/configuring-your-environment.md](getting-started/configuring-your-environment.md) |
| Find an email the app "sent" locally | [getting-started/local-services.md](getting-started/local-services.md) |
| Make myself an admin locally | [getting-started/your-first-account.md](getting-started/your-first-account.md) |
| Understand how a request flows end to end | [architecture/request-lifecycle.md](architecture/request-lifecycle.md) |
| Find out where a setting comes from | [architecture/configuration.md](architecture/configuration.md) |
| Push something to clients as it happens | [architecture/real-time-events.md](architecture/real-time-events.md) |
| Move work off the request | [architecture/background-jobs.md](architecture/background-jobs.md) |
| Write or change an endpoint | [server/controllers.md](server/controllers.md), [server/routing-and-rate-limits.md](server/routing-and-rate-limits.md) |
| Shape a response or pick an error status | [server/responses-and-errors.md](server/responses-and-errors.md) |
| Query the database | [backend/daos.md](backend/daos.md) |
| Validate input | [shared/schema.md](shared/schema.md), [backend/validation.md](backend/validation.md) |
| Check what a user may do | [backend/permissions.md](backend/permissions.md), [shared/permissions.md](shared/permissions.md) |
| Put code behind a feature flag, or migrate data | [backend/feature-flags-and-migrations.md](backend/feature-flags-and-migrations.md) |
| Find the table for something | [database/data-model.md](database/data-model.md) |
| Name something | [standards/naming.md](standards/naming.md) |
| Add a dependency | [standards/dependencies.md](standards/dependencies.md) |
| Open a pull request | [standards/git-workflow.md](standards/git-workflow.md), [standards/definition-of-done.md](standards/definition-of-done.md) |
| Decide which tests a change needs | [testing/strategy.md](testing/strategy.md) |
| Run or write integration tests | [testing/integration-tests.md](testing/integration-tests.md), [testing/writing-integration-tests.md](testing/writing-integration-tests.md) |
| Run or write end-to-end tests | [testing/e2e-tests.md](testing/e2e-tests.md), [testing/writing-e2e-tests.md](testing/writing-e2e-tests.md) |
| Run a manual test run | [testing/manual-tests.md](testing/manual-tests.md) |
| Write documentation | [standards/documentation.md](standards/documentation.md) |

## Find It by Code

| Before changing... | Read |
| ------------------ | ---- |
| `web-application/server/` | [server/README.md](server/README.md) |
| `web-application/server/controllers/` | [server/controllers.md](server/controllers.md) |
| `packages/session/` | [server/session-package.md](server/session-package.md) |
| `packages/backend/` | [backend/README.md](backend/README.md) |
| `packages/backend/daos/` | [backend/daos.md](backend/daos.md) |
| `packages/backend/services/permission/` | [backend/permissions.md](backend/permissions.md) |
| `packages/backend/services/validation/` | [backend/validation.md](backend/validation.md) |
| `packages/backend/migrations/` | [backend/feature-flags-and-migrations.md](backend/feature-flags-and-migrations.md) |
| `packages/backend/config.js`, any `config/` directory | [architecture/configuration.md](architecture/configuration.md) |
| `packages/backend/events.js`, `web-application/server/wsServer.js` | [architecture/real-time-events.md](architecture/real-time-events.md) |
| `packages/shared/` | [shared/README.md](shared/README.md) |
| `worker/` | [worker/README.md](worker/README.md) |
| `database/` | [database/README.md](database/README.md) |
| `package.json`, `package-lock.json` | [standards/dependencies.md](standards/dependencies.md) |
| `web-application/test/` | [testing/README.md](testing/README.md) |
| `documentation/testing/test-cases/` | [testing/writing-test-cases.md](testing/writing-test-cases.md) |
