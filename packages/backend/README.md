# Communities Backend

The backend services shared by the `worker` and `web-application`.

## Building and Deploying

This package is part of the Communities npm workspace and isn't published to
any registry. The worker and web-application Docker images include it from
source, and the Release workflow versions it together with every other
workspace package (`npm version <version> --workspaces`).

To run its tests from the repository root:

```
npm ci
npm test -w packages/backend
```
