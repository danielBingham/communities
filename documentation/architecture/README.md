# Architecture

How the platform fits together, and where to look in the code for each
piece. These files orient you; the code has the details.

| File | Read it when |
| ---- | ------------ |
| [overview.md](overview.md) | You're new, or need the map: every piece, what it's for, and how they talk. |
| [environments.md](environments.md) | Working out what differs between development, staging and production. |
| [configuration.md](configuration.md) | Wondering where a setting comes from, or how the apps reach AWS. |
| [server.md](server.md) | Working in `web-application/server/`: endpoints, response shapes, sessions, CSRF. |
| [backend.md](backend.md) | Working in `packages/backend/`: DAOs, services, validation, permissions. |
| [shared.md](shared.md) | Working in `packages/shared/`: Schemas, the move away from the old validators, shared permission rules. |
| [client.md](client.md) | Working in `web-application/client/`: how data reaches components, state, local storage, the build. |
| [worker.md](worker.md) | Working in `worker/`, on a queue, or on notifications. |
| [mobile.md](mobile.md) | Working on the iOS and Android apps: variants, native projects, live updates. |
