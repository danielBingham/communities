# Definition of Done

What a complete change includes before it's ready for review. Not every
item applies to every change; go through them all and skip the ones that
don't.

## Code

- [ ] Matches the code around it. No linter or formatter is configured, so
      the existing code is the style guide: 4-space indentation, no
      semicolons, and the patterns of the layer it's in.
- [ ] New source files (JavaScript, CSS, SQL) start with the AGPL license
      header. Copy it from a neighboring file.
- [ ] Behind a feature flag if it needs a migration, or should be turned on
      separately from the release. See
      [Add a Feature Flag](../how-to/add-a-feature-flag.md).

## Security

- [ ] Every new route has a rate limit in `router.js`.
- [ ] Every input is cleaned and validated, route parameters included,
      with the entity's Schema where it has one.
- [ ] Every read and write is checked with `PermissionService.can()`, for
      every entity the request touches. What the user can't see answers 404.
- [ ] SQL takes values only as parameters, never in the string.
- [ ] No secrets in code, logs or responses.
- [ ] User-supplied URLs are only fetched through
      `packages/backend/lib/ssrf-safe-fetch.js`.
- [ ] Anything test-only is limited to development and staging, and needs
      the test secret.

## Database

- [ ] Schema or data changes are a migration under the change's feature
      flag that runs forward and back cleanly, and `schema.sql` matches the
      schema with it applied. See
      [Add a Database Migration](../how-to/add-a-database-migration.md).

## Tests

- [ ] Unit tests for new logic in `packages/shared` and `packages/backend`,
      especially permissions and validation.
- [ ] Integration tests for new or changed endpoints, including their
      permissions and errors.
- [ ] End-to-end tests for UI cases that can be automated.
- [ ] Manual test cases added or updated for the behavior, and automated
      cases marked `(covered: ...)`.
- [ ] `npm test` and `npm run check:lockfile` pass, and the integration and
      end-to-end tests touching the change pass locally.

See [Testing Strategy](../testing/strategy.md) for which tests a change
needs.

## Documentation

- [ ] Documentation the change makes wrong is updated: a command, a setup
      step, a configuration value, a process, or the map of where things
      are. See [Documentation](documentation.md).
- [ ] New configuration values are in every configuration file and
      `.env.local.example`.

## Dependencies

- [ ] New dependencies are pinned exactly, in the package that uses them,
      and the lockfile check passes. See [Dependencies](dependencies.md).

## The Pull Request

- [ ] Says what the change needs for a release (a flag, a configuration
      value, a queue, a store release); see [Releases](../releases.md).
