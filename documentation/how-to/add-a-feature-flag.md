# Add a Feature Flag

How to put a change behind a flag, so it ships turned off and is turned on
separately. A flag is needed for anything with a migration (see
[Add a Database Migration](add-a-database-migration.md)), and useful for
anything that should be turned on, or off again, without a release.

**Code:** `packages/backend/services/FeatureService.js`,
`web-application/client/components/admin/features/`

## 1. Register It

Name it after the branch (`feat-123-short-name`), and add it to
`this.features` in `FeatureService`'s constructor, with its migration if it
has one:

```javascript
'feat-123-short-name': {},
'feat-123-short-name': { migration: new Feat123ShortNameMigration(core) },
```

Add it to the `INSERT INTO features` in
`database/initialization-scripts/schema.sql` as `enabled`, so a new
database starts with it on.

## 2. Check It

| Where | How |
| ----- | --- |
| Controllers and services | `this.core.features.has('feat-123-short-name')`, inside the request, never in a constructor. An endpoint that's entirely behind the flag answers 503 `unsupported` while it's off. |
| DAOs | `needsFeature: 'feat-123-short-name'` on columns the flag's migration adds. |
| Worker jobs | `core.features.has(...)`. The worker only reads flags when it starts. |
| Client | `useFeature('feat-123-short-name')`. |
| Integration tests | `isFeatureEnabled()` in `before()`, and `t.skip()` when it's off. |

Only `enabled` counts as on. The code must work with the flag off: that's
how it ships, and how it's rolled back.

## 3. Try It Both Ways

A flag moves through its lifecycle from `/admin/features` (see
[Your First Account](../getting-started/your-first-account.md)):

| Button | Status after | Runs |
| ------ | ------------ | ---- |
| Insert | `created` | Adds the flag's row. |
| Initialize | `initialized` | The migration's `initForward()`. |
| Migrate | `migrated` | The migration's `migrateForward()`. |
| Enable | `enabled` | Nothing: the code now sees the flag. |
| Disable | `disabled` | Nothing. |
| Rollback | `rolled-back` | The migration's `migrateBack()`. |
| Uninitialize | `uninitialized` | The migration's `initBack()`. |

Locally, run your flag forward to `enabled` and check the feature, then
disable it and check the app works without it. While a step runs, the
status is its `-ing` form (`migrating`); a step that fails and can't undo
itself leaves the flag there, and the database needs fixing by hand.

## 4. Roll It Out

Say in your pull request that it adds a flag. Maintainers turn flags on in
staging, then production, after the release that carries them; see
[Releases](../releases.md).

## 5. Retire It

Once it's been on everywhere for a while, a follow-up change removes the
checks, takes it out of the registry, and moves its migration to
`packages/backend/migrations/archive/`.
