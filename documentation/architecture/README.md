# Architecture

How the pieces of the platform work together. These files describe flows
across components; how each component's code is structured is in its own
directory ([server](../server/README.md), [backend](../backend/README.md),
[client](../client/README.md), and so on).

| File | Read it when |
| ---- | ------------ |
| [overview.md](overview.md) | You're new, or need the map: every piece, what it's for, and how they talk. |
| [environments.md](environments.md) | Working out what differs between development, staging and production. |
| [configuration.md](configuration.md) | Wondering where a setting comes from, or how configuration is loaded and checked. |
| [request-lifecycle.md](request-lifecycle.md) | Following an API request from a component to the database and back. |
| [real-time-events.md](real-time-events.md) | Working with the WebSocket, job progress, or pushing anything to clients. |
| [background-jobs.md](background-jobs.md) | Moving work off the request, or working with the queues and worker. |
| [security-model.md](security-model.md) | Understanding the layers of defense and where each is enforced. |
