# Add a Feature Flag

How to put a change behind a flag, so it ships turned off and is turned on
separately. A flag is needed for anything with a migration, and useful for
anything that should be turned on (or off again) without a release. How
flags work is in
[Feature Flags and Migrations](../backend/feature-flags-and-migrations.md).

## 1. Register It

Name it after the branch (`feat-123-short-name`), and add it to
`this.features` in `packages/backend/services/FeatureService.js`:

```javascript
'feat-123-short-name': {},                 // no migration
'feat-123-short-name': {                   // with one
    migration: new Feat123ShortNameMigration(core)
},
```

For a migration, see [Add a Database Migration](add-a-database-migration.md).

Add it to the `INSERT INTO features` in `schema.sql` as `enabled`, so a new
database starts with it on.

## 2. Check It

| Where | How |
| ----- | --- |
| Controllers and services | `if ( ! this.core.features.has('feat-123-short-name') ) { ... }`, inside the request, never in a constructor. A whole endpoint behind a flag answers 503 `unsupported` while it's off. |
| DAOs | `needsFeature: 'feat-123-short-name'` on columns the flag's migration adds. |
| Worker jobs | `core.features.has(...)`, remembering the worker only reads flags when it starts. |
| Client | `const enabled = useFeature('feat-123-short-name')`, to hide what isn't available yet. |
| Integration tests | `isFeatureEnabled()` in `before()`, and `t.skip()` when it's off. See [Writing Integration Tests](../testing/writing-integration-tests.md#feature-flags). |

The code must work with the flag off: that's how it ships, and how it's
rolled back.

## 3. Try It Both Ways

Locally, insert and enable the flag from `/admin/features` (see
[Your First Account](../getting-started/your-first-account.md)), then
disable it and check the app works without it.

## 4. Roll It Out

Maintainers turn flags on in staging, then production, after a release;
see [Releases](../releases.md). Mention the flag in your pull request.

## 5. Retire It

Once it's been on everywhere for a while, a follow-up change removes the
checks (and archives its migration).
