# Releases

How a change gets from a merged pull request to production, and what that
means for what you build. Releases are made by maintainers; the steps they
follow are documented in the infrastructure repository.

**Code:** `.github/workflows/release.yaml`

## Versions

- Releases have semantic versions: `0.24.6`.
- Release candidates for staging add `-rc.N`: `0.24.6-rc.1`.
- Every workspace package shares one version. The Release workflow sets it
  in every `package.json` and the lockfile, commits `Version <version>`,
  and tags the commit. **Don't change versions yourself.**

The client and server of a release always have the same version, which is
how the web client and the apps know to update (see
[Mobile](architecture/mobile.md#live-updates)).

## The Path to Production

1. **Your pull request merges into `staging`.**
2. **A release candidate** is built from `staging` by the Release workflow
   (its images, and the `database-helper`), deployed to
   `staging.communities.social`, and tested: the Smoke Test at least, and
   more for a large release (see [Testing Strategy](testing/strategy.md)).
3. **`staging` merges into `main`**, and the release is built from `main`
   and deployed to production.
4. **New feature flags are rolled out** on production from the admin
   dashboard: inserted, initialized, migrated and enabled, after they've
   been through the same on staging.
5. **The apps** get the new client as a live update. A store release is
   only made when native code changed.

## What Your Change Needs for a Release

Say in your pull request if it needs any of these, so maintainers can plan
for them:

| If your change... | It needs | Because |
| ----------------- | -------- | ------- |
| Changes the schema or data | A migration behind a feature flag (see [Add a Database Migration](how-to/add-a-database-migration.md)) | Migrations run from the admin dashboard after a deploy, and images can be rolled back but migrations stay applied. Code behind a flag has to work with it off. |
| Adds a configuration value | The value set for staging and production | They're kept in Parameter Store, which maintainers manage. See [Add a Configuration Value](how-to/add-a-configuration-value.md). |
| Adds a worker queue | A new worker deployment | Each queue runs as its own deployment. See [Add a Worker Job](how-to/add-a-worker-job.md). |
| Changes native code, a Capacitor plugin, or `capacitor.config.js` | An app store release | Live updates only replace the web bundle. |
| Changes a feature a worker job checks for | The workers restarted after the flag is enabled | Workers read feature flags when they start. |

## Rolling Back

If a release goes wrong, production is rolled back to the previous
version's images. That doesn't undo migrations, which is why changes that
need them sit behind a flag that can be disabled, and why migrations must
be safe to run backward.
