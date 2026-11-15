# Feature Flags and Migrations

Feature flags let code ship before it's turned on, and carry the migration
that prepares the database for it. Each flag moves through a lifecycle,
driven from the admin dashboard, and its migration runs at the steps that
need it.

**Code:** `packages/backend/services/FeatureService.js`,
`packages/backend/migrations/`, `packages/backend/features.js`,
`web-application/server/controllers/FeatureController.js`,
`web-application/client/components/admin/features/`

## Where Flags Live

A flag exists in two places:

- **In code:** the `features` registry in `FeatureService`'s constructor,
  by name, with its migration if it has one:

  ```javascript
  'feat-268-comment-reactions': {
      migration: new Feat268CommentReactionsMigration(core)
  },
  'video-uploads': {},
  ```

- **In the database:** the `features` table, with the flag's `status`. A
  flag is added there when an administrator inserts it from the dashboard
  after a deploy.

## Checking a Flag

| Where | How |
| ----- | --- |
| Server | `this.core.features.has('feat-268-comment-reactions')`, inside a request (flags are loaded per request). |
| DAOs | `needsFeature: 'issue-165-subgroups'` on a column, so it's only read once the flag is on. See [DAOs](daos.md). |
| Client | The `useFeature('feat-268-comment-reactions')` hook. |

Only `enabled` counts as on. Code behind a flag has to work both ways,
since the flag can be off in any environment, and off again after a
rollback.

## The Lifecycle

| Action (dashboard) | Status after | Runs |
| ------------------ | ------------ | ---- |
| Insert | `created` | Adds the row. |
| Initialize | `initialized` | `migration.initialize()` → `initForward()`. |
| Migrate | `migrated` | `migration.up()` → `migrateForward()`. |
| Enable | `enabled` | Nothing: the code now sees the flag. |
| Disable | `disabled` | Nothing. |
| Roll back | `rolled-back` | `migration.down()` → `migrateBack()`. |
| Uninitialize | `uninitialized` | `migration.uninitialize()` → `initBack()`. |

While a step runs, the status is the `-ing` form (`initializing`,
`migrating`, `rolling-back`, `uninitializing`).

## Migrations

A migration extends `BaseMigration` and implements four methods, each
undoing the other of its pair:

| Method | For |
| ------ | --- |
| `initForward()` | Setup with no risk to data, backward compatible: new tables, new nullable columns, new enum types, indexes. |
| `initBack()` | Undoes `initForward()`. |
| `migrateForward(targets)` | Changing data: filling new columns, moving rows. Must be non-destructive. |
| `migrateBack(targets)` | Undoes `migrateForward()`. |

`BaseMigration` wraps each step: if a forward step throws, it runs the
backward step to compensate and throws `MigrationError('rolled-back')`;
`FeatureService` then returns the flag to its previous status. If the
compensation fails too, it throws `MigrationError('no-rollback')` and the
flag stays in its `-ing` status: the database needs fixing by hand.

The steps aren't wrapped in a transaction, so write each statement to be
safe to repeat (`CREATE TABLE IF NOT EXISTS`, `DROP INDEX IF EXISTS`).
`Feat268CommentReactionsMigration.js` is a small, recent example to
follow. `ExampleMigration.js` predates `BaseMigration` and doesn't extend
it, so don't copy it.

## `schema.sql`

`database/initialization-scripts/schema.sql` is the schema with every
migration applied, and inserts every migrated flag as `enabled`. When you
add a migration, apply its changes to `schema.sql` and add the flag to the
`INSERT INTO features`, in the same change. A new database then starts
with the feature on, and its migration is never run there.

## Retiring a Flag

Once a flag has been enabled everywhere for a while, its checks can be
removed from the code and its migration moved to `migrations/archive/`
(and out of the registry). Archived migrations are kept for reference.

## Adding One

See [Add a Feature Flag](../how-to/add-a-feature-flag.md) and
[Add a Database Migration](../how-to/add-a-database-migration.md). Rolling
flags out on staging and production is done by maintainers.
