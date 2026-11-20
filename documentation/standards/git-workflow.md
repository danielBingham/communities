# Git Workflow

How changes get from a branch into a release.

**Code:** `.github/workflows/ci.yaml`, `.github/workflows/release.yaml`

## Branches

| Branch | What it is |
| ------ | ---------- |
| `staging` | The integration branch. Every change merges here first, and release candidates for staging are built from it. |
| `main` | What's released to production. Only maintainers merge into it, from `staging`, when cutting a release. |
| `{feat,fix,test,doc}-NNN-short-name` | Your work, branched from `staging`. `NNN` is the GitHub issue number. |

| Prefix | For |
| ------ | --- |
| `feat` | A new feature or a change in behavior. |
| `fix` | A bug fix. |
| `test` | Tests only. |
| `doc` | Documentation only. |

The branch name is also the name of the feature flag and the manual test
run directory, if the change has them.

## Making a Change

1. Make sure there's an issue for it, and note its number.
2. Branch from an up-to-date `staging`:
   `git switch -c feat-123-short-name staging`.
3. Make the change, with its tests and documentation. See the
   [Definition of Done](definition-of-done.md).
4. Run the unit tests (`npm test`), the lockfile check
   (`npm run check:lockfile`), and the integration and end-to-end tests
   that touch what you changed.
5. Open a pull request into `staging`. Say what changed and why, link the
   issue, and list the tests you ran and any manual test cases you checked.

## Continuous Integration

The CI workflow runs on every pull request into, and every push to,
`staging` and `main`:

1. `npm ci`
2. `npm run check:lockfile`
3. `npm test` (the unit tests)

The integration and end-to-end tests need a running stack and aren't run
by CI yet: run them yourself, and maintainers run them against staging.

## Releases

Maintainers cut releases from `staging` and `main` with the Release
workflow. See [Releases](../releases.md) for what a release means for a
change you've merged.
