# Full Regression Test

This document contains a checklist of test cases to be run during a full
regression of the platform. To run a full regression, run through the full
checklist on Desktop and then again on Mobile.

Create a directory under `releases/` named for the feature, eg.
`19-private-groups` and place the checklist below in the `index.md` file. Copy
the [Regression](#regression) section to a file with an appropriate name, eg.
`pre-migration-desktop-regression.md` and work through it.

- [-] Run a full regression pre-migration to confirm feature flag works (if
    applicable).
    - [-] On a Desktop browser, run through [Regression](#regression)
    - [-] On a Mobile browser, run through [Regression](#regression)
- [ ] Run a full regression post-migration (if applicable) to confirm feature
    works.
    - [x] On a Desktop browser, run through [Regression](#regression)
    - [ ] On a Mobile browser, run through [Regression](#regression)

## Migrations
- [x] As Administrator, run any migrations associated with this release.
- [x] As Administrator, create content associated with those migrations. Confirm content creates.
- [x] As Administrator, rollback the migrations. Confirm migrations rollback cleanly.
- [x] As Administrator, run migrations forward again.
