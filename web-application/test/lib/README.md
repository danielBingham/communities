# Shared Test Library

What the [integration tests](../integration/README.md) and the
[end-to-end tests](../e2e/README.md) have in common: the fixture users they
log in as, the setup that creates and deletes them, and helpers for calling the
API. Both suites run against your local environment or staging, never
production.

| File | What it's for |
| ---- | ------------- |
| [`setup.js`](setup.js) | Creates the fixture users before a run and deletes them after. |
| [`fixtures/users.js`](fixtures/users.js) | The fixture users. |
| [`fixtures/index.js`](fixtures/index.js) | `getFixture(key)`: a fixture user as this run created it. |
| [`fetchEndpoint.js`](fetchEndpoint.js) | Calls the API at `API_ROOT`. |
| [`production.js`](production.js) | Refuses to let the tests touch production. |
| [`authentication.js`](authentication.js) | `loginAs(key)`, `logout(session)` and the like, through the API. |
| `posts.js`, `groups.js`, `relationships.js`, ... | Setting up and cleaning up through the API: creating posts, groups and friendships, deleting them. |

The end-to-end tests use the API helpers to set up what a case starts from
(a post to edit, a friendship), and then act in the browser.

## The fixture users

[`setup.js`](setup.js) runs once before the first test file and once after
the last: the integration scripts pass it to Node's test runner with
`--test-global-setup`, and the end-to-end scripts pass
[`../e2e/setup.js`](../e2e/setup.js), which runs it. Before the tests, it
creates every user in `fixtures/users.js` through `POST /test/user`, each
with:

- a username and email unique to this run: `test-<run>-<key>` and
  `communities-test-<run>-<n>@mailinator.com`,
- a random password, which only this run ever knows.

The MFA fixture, `user-mfa`, also gets a TOTP secret and ten recovery codes,
as if it had enrolled an authenticator app. `multifactor.js` generates
tokens from the secret; each recovery code works once.

The test files get them from `getFixture(key)` in
[`fixtures/index.js`](fixtures/index.js), id, password and MFA secret
included; `loginAs(key)` in `authentication.js` logs in with them through
the API, and `openAs(key)` in `../e2e/lib/browser.js` in a browser. The runner
hands them to each test process in an environment variable, so they're never
written anywhere. The test secret stays with `setup.js`.

After the tests, passed, failed or interrupted with Ctrl-C, `setup.js`
deletes them all through `DELETE /test/user/:id`. If it can't delete some,
it lists them and the run fails. A run that's killed outright leaves its
users behind; nobody has their passwords, and their emails all start with
`communities-test-<run>-`.

If creating a fixture fails, the run stops before any test, says why, and
deletes the ones it had created.

To add a fixture, or change one, edit `fixtures/users.js`. An entry
describes the account: its name, and optionally a `status` (`unconfirmed`,
`invited`, `banned`), a `siteRole` (`moderator`, `admin`), `multifactor:
'enabled'`, a `siteModeration` of its profile flagged by an earlier entry, or
the `notices` it has already seen (`termsOfService`, `welcomeNotice`).

The API doesn't look at notices, but the client does: it sends a user who
hasn't accepted the Terms of Service to `/accept-terms-of-service` before
anything else, and shows one who hasn't seen the welcome notice a modal over
whatever page they open. So every fixture the end-to-end tests log in as has
`notices: NOTICES_SEEN`. Leave them off a fixture meant for testing those
flows.

## The test endpoints

`POST /test/user` and `DELETE /test/user/:id` belong to the web
application's `TestController` (`server/controllers/TestController.js`).
They exist only when the server runs in local development or on staging with
a `test.secret` in its configuration: `env:COMMUNITIES_TEST_SECRET` in the
local example configuration, `/test/secret` in Parameter Store for staging
(and the Parameter Store example). They only answer requests that carry both:

- `X-Communities-Platform: test`, as all the API helpers' requests do;
- `X-Communities-Test-Secret`, the secret, which `setup.js` adds.

Unlike registration, `POST /test/user` can create accounts that are already
confirmed, banned, invited, a site moderator or admin, have multi-factor
authentication on, have their profile flagged, or have already seen the Terms
of Service and welcome notices. `DELETE /test/user/:id` only deletes accounts
whose email follows the fixture pattern, so it can't delete anyone else.

Locally, `setup.js` reads the secret from `COMMUNITIES_TEST_SECRET` in the same
`.env` the server uses. For staging, pass it in the environment; see each
suite's README.

## Staying off production

Every API request goes through `fetchEndpoint.js`, which refuses an
`API_ROOT` on production: `communities.social` or any host under it except
`staging.communities.social` ([`production.js`](production.js)). The
end-to-end tests also check the browser's `BASE_URL`, and abort any request
the page itself makes to production.

## Email

The tests never read email, and the fixture users only have web
notifications on (no email, desktop or mobile). Their addresses are
`@mailinator.com` addresses so that anything staging does send them goes
somewhere harmless.
