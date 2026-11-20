# Add a Database Migration

How to change the schema or data: a migration class, registered under a
feature flag, applied to `schema.sql`, and run forward and back.

**Code:** `packages/backend/migrations/`,
`packages/backend/services/FeatureService.js`,
`database/initialization-scripts/schema.sql`

## 1. Write the Migration

Create `packages/backend/migrations/<Flag>Migration.js`, named after the
flag in PascalCase (`feat-123-short-name` → `Feat123ShortNameMigration`).
Follow `Feat268CommentReactionsMigration.js`, not `ExampleMigration.js`,
which predates `BaseMigration` and doesn't extend it.

A migration extends `BaseMigration` and implements four methods:

| Method | For |
| ------ | --- |
| `initForward()` | Anything with no risk to data that old code ignores: new tables, new nullable columns, enum types, indexes. |
| `migrateForward(targets)` | Changing existing data: filling a new column, moving rows. Never delete data; copy it, and leave the old in place until a later cleanup. |
| `initBack()`, `migrateBack(targets)` | The exact reverse of each. |

`BaseMigration` runs the reverse step when a forward step throws. The
steps aren't in a transaction, so write every statement to be safe to run
twice (`CREATE TABLE IF NOT EXISTS`, `DROP INDEX IF EXISTS`).

## 2. Register It

Require it in `FeatureService.js` and give it to the flag in
`this.features` (see [Add a Feature Flag](add-a-feature-flag.md)).

## 3. Update `schema.sql`

`schema.sql` is the schema with every migration applied, and a new
database never runs migrations. So in the same change:

- [ ] Apply the same changes to `schema.sql`, so a new database is what the
      migration would produce.
- [ ] Add the flag to its `INSERT INTO features` as `enabled`.

## 4. Use It in Code

Check the flag wherever code depends on the new schema, and mark new
columns in the DAO's entity map with `needsFeature`, so the code works
before the migration runs.

## 5. Test It Locally

Your local database was made from the old `schema.sql`, so the flag isn't
in it yet. As a superadmin, on `/admin/features`:

1. **Insert**, **Initialize**, **Migrate**, **Enable**, and check the
   feature works.
2. Create some data with it.
3. **Disable**, **Rollback**, **Uninitialize**, and check the old code
   still works and the database is as it was.
4. Run it forward again.

Then start from an empty database with the new `schema.sql` (see
[Local Data](../getting-started/local-data.md)) and check the feature works
there too. Record the migration steps in the feature's manual test run;
see [Manual Tests](../testing/manual-tests.md#migrations).
