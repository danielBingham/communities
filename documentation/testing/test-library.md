# The Shared Test Library

What the integration and end-to-end tests share: the fixture users they log
in as, and the test endpoints that create them. The helpers for calling the
API and setting up data are in the same directory, one file per entity.

**Code:** `web-application/test/lib/`,
`web-application/server/controllers/TestController.js`

## Sessions

The helpers act like the mobile apps: they send `X-Communities-Platform:
test`, so the session ID travels in the `X-Communities-Auth` header rather
than a cookie. `loginAs(key)` (`authentication.js`) logs in as a fixture
user and returns `{ session, user, fixture }`; pass `session` to any helper.

## The Fixture Users

`setup.js` runs once before the first test file and once after the last
(the npm scripts pass it to Node's test runner with
`--test-global-setup`). Before the tests, it creates every user in
`fixtures/users.js` through `POST /test/user`, each with a username and
email unique to the run (`test-<run>-<key>`,
`communities-test-<run>-<n>@mailinator.com`) and a random password only
this run knows. The runner hands them to each test process in an
environment variable, so they're never written anywhere.

After the tests (passed, failed, or interrupted with Ctrl-C), `setup.js`
deletes them all through `DELETE /test/user/:id`, and fails the run if it
can't. A run that's killed outright leaves its users behind; nobody has
their passwords.

Fixtures are shared by every file in a run, so a test starts from a known
state in `before()` and cleans up what it made in `after()`.

### Adding or Changing a Fixture

Edit `fixtures/users.js`. An entry describes the account: its `name`, and
optionally a `status`, a `siteRole`, `multifactor: 'enabled'`, a flagged
profile, or the `notices` it has already seen.

The API ignores notices, but the client doesn't: it sends a user who hasn't
accepted the Terms of Service to `/accept-terms-of-service`, and shows the
welcome notice over any page until it's seen. So every fixture the
end-to-end tests log in as has `notices: NOTICES_SEEN`. Leave it off a
fixture meant for testing those flows.

## The Test Endpoints

`POST /test/user` and `DELETE /test/user/:id` only exist when the server
runs in development or on staging with a `test.secret` configured
(`COMMUNITIES_TEST_SECRET` locally), and only answer requests carrying both
`X-Communities-Platform: test` and `X-Communities-Test-Secret`.
`POST /test/user` can create accounts in states registration can't
(confirmed, banned, an admin, with MFA). `DELETE /test/user/:id` only
deletes accounts whose email follows the fixture pattern.

Locally, `setup.js` reads the secret from the same `.env` the server uses.
For staging, pass it in the environment; see
[Integration Tests](integration-tests.md#staging).

## Staying Off Production

Every API request goes through `fetchEndpoint.js`, which refuses an
`API_ROOT` on production: `communities.social` or any host under it except
`staging.communities.social`. The end-to-end tests also check `BASE_URL`,
and abort any request the page makes to production. The fixtures' email
addresses are at `mailinator.com`, so anything staging does send goes
somewhere harmless.
