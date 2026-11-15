# Backend

`packages/backend` (`@communities/backend`): the server-side code the web
application and worker share. `Core`, DAOs, services, validation,
permissions, events, drivers and migrations.

**Code:** `packages/backend/`

| File | Read it when |
| ---- | ------------ |
| [structure.md](structure.md) | Finding your way around the package, or deciding which layer something belongs in. |
| [core.md](core.md) | Using `core`, or changing how the apps connect and shut down. |
| [daos.md](daos.md) | Writing or changing a DAO, or building a query. |
| [services.md](services.md) | Looking for the service that does something, or adding one. |
| [validation.md](validation.md) | Validating an entity, or adding validation rules. |
| [permissions.md](permissions.md) | Checking or changing what a user may do. |
| [events.md](events.md) | Working with `core.events` or an event handler. |
| [feature-flags-and-migrations.md](feature-flags-and-migrations.md) | Putting code behind a flag, or writing a migration. |
| [drivers.md](drivers.md) | Working with email, storage or push drivers, or adding one. |

The package is part of the npm workspace and isn't published. The Docker
images include it from source, and the Release workflow versions it with
every other workspace package. Run its tests with
`npm test -w packages/backend`.
