# Unit Tests

The Jest tests in the workspace packages. They need no running stack: the
database, Redis and outside services are mocked. CI runs them on every pull
request and push to `staging` and `main`.

**Code:** `packages/shared/test/`, `packages/backend/test/`,
`web-application/test/unit/`, `.github/workflows/ci.yaml`

## Running Them

From the repository root:

```
npm test                                   # every package
npm test -w packages/backend               # one package
npm run jest -w packages/backend -- test/services/EmailService.spec.js   # one file
```

`npm test` runs `packages/shared`, `packages/backend` and `web-application`.
`packages/session` has its own Mocha tests (`npm test -w packages/session`),
inherited from express-session.

## Where They Live

Spec files mirror the path of the code they test and end in `.spec.js`.

## Fixtures

`packages/backend/test/fixtures/` has two matching sets of the same test
data:

- `database/`: rows as PostgreSQL returns them, to feed a mocked
  `core.database.query`.
- `entities/`: the same data hydrated into entities, as `dictionary`
  objects keyed by id, for the inputs and expected results.

A typical backend test builds a minimal `core` with `database.query` as a
`jest.fn()`, queues the rows each query should return with
`mockReturnValueOnce()`, and turns logging off with `core.logger.level = -1`.
See `packages/backend/test/services/PermissionService/post/canDeletePost.spec.js`.

`web-application/test/unit/client/fixtures/` holds API responses, store
states and expected results for the client's state tests.

## What's Worth a Unit Test

- Permission and validation rules: every branch, since they're security.
- Schemas, cleaners and validators.
- Shared helpers with real logic (mentions, dates, page metadata).
- Server modules with behavior that's awkward to reach through the API
  (configuration loading, certificates).

Behavior that depends on the database or several layers working together is
better covered by an [integration test](integration-tests.md).
