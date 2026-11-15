# Security

The checklist every change follows. Where each defense lives is in
[Security Model](../architecture/security-model.md).

## Every Endpoint

- [ ] **Has a rate limit** in `router.js`, sized to how the route is used:
      generous for reads the client makes often, tight for writes and
      anything that sends email or costs us money.
- [ ] **Checks authentication first**, before looking anything up.
- [ ] **Cleans and validates every input**: the body, the query string, and
      each route parameter (an id that isn't a UUID is a 400, not a database
      error). Use the entity's Schema where it has one.
- [ ] **Checks permission with `PermissionService.can()`** before reading or
      writing, for every entity it touches, not just the one in the URL.
- [ ] **Answers 404 for what the user can't see**, exactly as for what
      doesn't exist.
- [ ] **Only returns what the user may see**: relations go through the same
      permission checks, and private columns are marked in the DAO's entity
      map as `SELECT.NEVER` (passwords) or `SELECT.REQUEST` (email), so
      they're only read when code asks for them.
- [ ] **Doesn't trust the client's permission checks.** The shared rules
      let the client hide buttons; the server decides.

## Data

- [ ] **Parameterized SQL only.** Values go in `params`, never into the SQL
      string. Where SQL is built dynamically (an `ORDER BY`, a list of
      columns), build it from a fixed list, never from input.
- [ ] **No secrets in code, logs or responses.** Secrets come from
      configuration. Passwords are hashed with bcrypt; MFA secrets are
      encrypted with `EncryptionService`; recovery codes are hashed.
- [ ] **Session changes regenerate the session** (`SessionService.regenerateSession()`)
      when the user logs in or their identity changes.

## Outbound

- [ ] **Fetch user-supplied URLs only through `ssrf-safe-fetch`**
      (`packages/backend/lib/ssrf-safe-fetch.js`), which refuses private
      addresses.
- [ ] **Files are served through signed links** from the storage driver,
      never by a public path.

## The Client

- [ ] **No `dangerouslySetInnerHTML`** with anything a user wrote. Render
      user content as text, through the existing components (mentions,
      links) that already do it safely.
- [ ] **CSP changes are deliberate.** Add a source to
      `web-application/server/middleware/security-headers.js` (and the
      meta tag in `webpack.config.js`) only for a specific need, with a
      comment saying what needs it.

## Tests and Test Code

- [ ] **Permission matrices are tested**: unit tests for the permission
      class, integration tests for the endpoint.
- [ ] **Test-only code stays out of production**: anything like the test
      endpoints is limited to development and staging, and needs the test
      secret.
