# Communities Documentation

How to run Communities, how it fits together, and the processes we follow.
It covers what the code doesn't make clear; for everything else, these
files tell you where in the code to look. Each directory has its own index:
start here, go to the directory you need, and read only the file you need.

## Start Here

1. [Getting Started](getting-started/README.md): run the platform locally.
2. [System Overview](architecture/overview.md): the pieces and how they fit.
3. [Repository Layout](layout.md): what's where.
4. [Definition of Done](standards/definition-of-done.md): what a change
   includes.

## Directories

| Directory | What's in it |
| --------- | ------------ |
| [getting-started/](getting-started/README.md) | Setting up and running the platform and the mobile apps on your machine. |
| [architecture/](architecture/README.md) | How the pieces fit together, and where to look in the server, backend, shared package, client, worker and mobile apps. |
| [database/](database/README.md) | How databases are initialized, locally and on staging. |
| [how-to/](how-to/README.md) | Checklists for feature flags, migrations, configuration values, worker jobs and notifications. |
| [standards/](standards/README.md) | Git workflow, dependencies, what a change includes, and what goes in the documentation. |
| [testing/](testing/README.md) | Unit, integration, end-to-end and manual tests: running and writing them. |
| [api/](api/README.md) | The API reference (to be rewritten). |

And [releases.md](releases.md): how a change gets to production, and what
your change needs for a release.

## Find It by Task

| I want to... | Read |
| ------------ | ---- |
| Run the platform locally | [getting-started/README.md](getting-started/README.md) |
| Configure my local environment | [getting-started/configuring-your-environment.md](getting-started/configuring-your-environment.md) |
| Find an email the app "sent" locally | [getting-started/local-services.md](getting-started/local-services.md) |
| Make myself an admin locally | [getting-started/your-first-account.md](getting-started/your-first-account.md) |
| Run the iOS or Android app | [getting-started/running-the-mobile-apps.md](getting-started/running-the-mobile-apps.md) |
| Find where something lives in the code | [layout.md](layout.md), then [architecture/README.md](architecture/README.md) |
| Find out where a setting comes from | [architecture/configuration.md](architecture/configuration.md) |
| Put code behind a feature flag, or migrate data | [how-to/add-a-feature-flag.md](how-to/add-a-feature-flag.md), [how-to/add-a-database-migration.md](how-to/add-a-database-migration.md) |
| Add a configuration value, a worker job or a notification | [how-to/README.md](how-to/README.md) |
| Know whether a change reaches the apps without a store release | [architecture/mobile.md](architecture/mobile.md#live-updates) |
| Know what a change needs for a release | [releases.md](releases.md) |
| Add a dependency | [standards/dependencies.md](standards/dependencies.md) |
| Open a pull request | [standards/git-workflow.md](standards/git-workflow.md), [standards/definition-of-done.md](standards/definition-of-done.md) |
| Decide which tests a change needs | [testing/strategy.md](testing/strategy.md) |
| Run or write integration tests | [testing/integration-tests.md](testing/integration-tests.md), [testing/writing-integration-tests.md](testing/writing-integration-tests.md) |
| Run or write end-to-end tests | [testing/e2e-tests.md](testing/e2e-tests.md), [testing/writing-e2e-tests.md](testing/writing-e2e-tests.md) |
| Run a manual test run | [testing/manual-tests.md](testing/manual-tests.md) |
| Write documentation | [standards/documentation.md](standards/documentation.md) |
