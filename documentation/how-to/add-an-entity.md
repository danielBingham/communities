# Add an Entity

The checklist for a new kind of thing (a table the API reads and writes,
and the client shows), through every layer, in order. Most features that
store something new follow it. Each step links to the doc for its layer.

Name everything after the entity, following [Naming](../standards/naming.md).
`CommentReaction` (feat-268) went through every step and is the model to
copy.

## 1. Plan It

- [ ] Write or update the manual test cases for it first:
      `documentation/testing/test-cases/<Entity>/`, and add them to
      `test-index.md`. See [Writing Test Cases](../testing/writing-test-cases.md).
- [ ] Name the feature flag after the branch (`feat-123-short-name`).

## 2. The Database

- [ ] A migration that creates the table, its enum types and indexes, under
      the flag. See [Add a Database Migration](add-a-database-migration.md)
      and [Schema Conventions](../database/conventions.md).
- [ ] The same in `schema.sql`, with the flag inserted as `enabled`.

## 3. The Backend

- [ ] **DAO:** `packages/backend/daos/<Entity>DAO.js`, with its entity map
      and `select`, `get...ById`, `insert`, `update` and `delete` methods.
      See [DAOs](../backend/daos.md).
- [ ] **Schema:** `packages/shared/schema/<Entity>.js`, cleaning and
      validating each property. See [Schemas](../shared/schema.md).
- [ ] **Validation:** `packages/backend/services/validation/<Entity>Validation.js`
      for rules that need the database, wired into `ValidationService`. See
      [Validation](../backend/validation.md).
- [ ] **Permissions:** `packages/backend/services/permission/<Entity>Permissions.js`,
      wired into `PermissionService.can()`, or a shared rule if the client
      needs it. See [Permissions](../backend/permissions.md).
- [ ] **Exports:** add the DAO to `packages/backend/index.js`.
- [ ] **Unit tests** for the Schema, validation and every permission.

## 4. The API

- [ ] **Controller:** `web-application/server/controllers/<Entity>Controller.js`,
      a method per route following the standard sequence, checking the flag
      first. See [Add an API Endpoint](add-an-api-endpoint.md).
- [ ] **Routes** in `router.js`, each with a rate limit.
- [ ] **Relations:** add the entity to the relations of anything that
      returns it with another entity, and to `getRelations()` of its own
      controller.
- [ ] **Integration tests**, one file per route, including permissions and
      errors, and API helpers for it in `web-application/test/lib/`.
- [ ] **Notifications**, if it should notify anyone. See
      [Add a Notification](add-a-notification.md).

## 5. The Client

- [ ] **Slice and thunks:** `web-application/client/state/<Entity>/`, the
      reducer in `store.js`, and the entity in `state/lib/relations.js` and
      `state/lib/reset.js`. See [State](../client/state.md).
- [ ] **Hooks:** `web-application/client/lib/hooks/<Entity>/`. See
      [Hooks](../client/hooks.md).
- [ ] **Components**, behind `useFeature()`. See
      [Components](../client/components.md).
- [ ] **End-to-end tests** for the UI cases that can be automated.

## 6. Finish

- [ ] Mark the automated cases `(covered: ...)`.
- [ ] Add the entity to the docs that list entities:
      [Data Model](../database/data-model.md), the
      [domain](../domain/README.md) doc for its feature, and
      [Services](../backend/services.md) if it has one.
- [ ] Run the migration forward and back locally, and go through the
      [Definition of Done](../standards/definition-of-done.md).
