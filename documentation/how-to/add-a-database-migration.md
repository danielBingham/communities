# Add a Database Migration

How to change the schema or data: a migration class, registered under a
feature flag, applied to `schema.sql`, and run forward and back. How
migrations work is in
[Feature Flags and Migrations](../backend/feature-flags-and-migrations.md).

## 1. Write the Migration

Create `packages/backend/migrations/<Flag>Migration.js`, named after the
flag in PascalCase (`feat-123-short-name` → `Feat123ShortNameMigration`),
following `Feat268CommentReactionsMigration.js`. (Don't copy
`ExampleMigration.js`: it predates `BaseMigration` and doesn't extend it,
so it has no automatic rollback.)

```javascript
const BaseMigration = require('./BaseMigration')

module.exports = class Feat123ShortNameMigration extends BaseMigration {
    constructor(core) {
        super(core)
    }

    async initForward() {
        await this.core.database.query(`CREATE TABLE IF NOT EXISTS ...`, [])
        await this.core.database.query(`CREATE INDEX IF NOT EXISTS ...`, [])
    }

    async initBack() {
        await this.core.database.query(`DROP INDEX IF EXISTS ...`, [])
        await this.core.database.query(`DROP TABLE IF EXISTS ...`, [])
    }

    async migrateForward(targets) { }
    async migrateBack(targets) { }
}
```

| Put in | What |
| ------ | ---- |
| `initForward()` | Anything with no risk to data and that old code ignores: new tables, new nullable columns, enum types, indexes. |
| `migrateForward()` | Changing existing data: filling a new column, moving rows. Never delete data; copy it, and leave the old in place until a later cleanup. |
| `initBack()`, `migrateBack()` | The exact reverse of each. |

Write every statement to be safe to run twice (`IF NOT EXISTS`,
`IF EXISTS`), since a failed step is compensated by running its reverse,
not by a transaction.

## 2. Register It

In `packages/backend/services/FeatureService.js`, require it and add it to
`this.features`:

```javascript
'feat-123-short-name': {
    migration: new Feat123ShortNameMigration(core)
},
```

## 3. Update `schema.sql`

In `database/initialization-scripts/schema.sql`:

- [ ] Apply the same changes, in the right section, so a new database is
      what the migration would produce. See
      [Schema Conventions](../database/conventions.md).
- [ ] Add the flag to the `INSERT INTO features` as `enabled`.

## 4. Use It in Code

- [ ] Check the flag wherever code depends on the new schema
      (`this.core.features.has('feat-123-short-name')`), and mark new columns
      in the DAO with `needsFeature`. See
      [Add a Feature Flag](add-a-feature-flag.md).

## 5. Test It Locally

Your local database was made from the old `schema.sql`, so the flag isn't
in it yet. As a superadmin, on `/admin/features`:

1. **Insert**, **Initialize**, **Migrate**, **Enable**, and check the
   feature works.
2. Create some data with it.
3. **Disable**, **Roll back**, **Uninitialize**, and check the old code
   still works and the database is as it was.
4. Run it forward again.

Also start from an empty database with the new `schema.sql` (see
[Local Data](../getting-started/local-data.md)) and check the feature works
there too. Record the migration steps in the feature's manual test run; see
[Running Manual Tests](../testing/manual-tests.md#migrations).

## Later

Once the flag has been enabled everywhere for a while, remove its checks
from the code, move the migration to `migrations/archive/`, and take it out
of the registry.
