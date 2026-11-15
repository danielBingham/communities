# The Shared Test Library

What the integration and end-to-end tests share: the fixture users they log
in as, the setup that creates and deletes them, the test endpoints that
setup uses, and helpers for calling the API. Both suites run against your
local stack or staging, never production.

**Code:** `web-application/test/lib/`,
`web-application/server/controllers/TestController.js`

## Files

| File | What it's for |
| ---- | ------------- |
| `setup.js` | Creates the fixture users before a run and deletes them after. |
| `fixtures/users.js` | The fixture users. |
| `fixtures/index.js` | `getFixture(key)`: a fixture user as this run created it. |
| `fetchEndpoint.js` | `fetchEndpoint(method, endpoint, options)`: calls the API at `API_ROOT`. |
| `production.js` | Refuses to let the tests touch production. |
| `authentication.js` | `loginAs(key)`, `initialize()`, `login()`, `logout(session)`, through the API. |
| `posts.js`, `postComments.js`, `postReactions.js`, `commentReactions.js`, `groups.js`, `relationships.js`, `users.js`, `news.js`, `pages.js` | Setting up and cleaning up through the API: creating posts, comments, groups and friendships, deleting them. |
| `system.js` | `isFeatureEnabled(name)` and other system lookups. |
| `files.js` | `uploadMedia(session, userId, key)`: uploads an image or video and waits for it to be processed. |
| `linkPreviews.js` | The links the tests post (`NEWS_LINKS`) and `createLinkPreview()`. |
| `multifactor.js` | Generates TOTP tokens from the MFA fixture's secret. |
| `fixtures/media.js` | `getMedia(key)` and `getCorruptedMedia(key)`: the files in `fixtures/assets/`, and corrupted copies of them. |

## Sessions

The helpers act like the mobile apps: they send `X-Communities-Platform:
test`, so the server sends the session ID in the `X-Communities-Auth` header
rather than a cookie. `initialize()` calls `GET /system/initialization` and
returns a session object, `{ csrf, auth }`; `login()` and `logout()` update
it. Pass it to any helper as `session`, and `fetchEndpoint()` adds both
headers. `loginAs(key)` does all of this for a fixture and returns
`{ session, user, fixture }`.

## The Fixture Users

`setup.js` runs once before the first test file and once after the last
(the integration scripts pass it to Node's test runner with
`--test-global-setup`; the end-to-end scripts pass `test/e2e/setup.js`,
which runs it). Before the tests, it creates every user in
`fixtures/users.js` through `POST /test/user`, each with:

- a username and email unique to the run: `test-<run>-<key>` and
  `communities-test-<run>-<n>@mailinator.com`;
- a random password only this run knows.

The keys are `user1` to `user9`, plus users for particular states:
`user-banned`, `user-mfa`, `user-lockout`, `user-unconfirmed`,
`user-privacy`, `user-site-moderator`, `user-site-admin`, `user-invited`,
`user-flagged` and `user-rejected`. Each is a confirmed `user` with only web
notifications on, unless its entry says otherwise. `user-mfa` also gets a
TOTP secret and ten recovery codes.

The runner hands the fixtures to each test process in an environment
variable, so they're never written anywhere. After the tests (passed,
failed, or interrupted with Ctrl-C) `setup.js` deletes them all through
`DELETE /test/user/:id`, and fails the run if it can't. A run that's killed
outright leaves its users behind; nobody has their passwords. If creating a
fixture fails, the run stops before any test and deletes the ones it made.

### Adding or Changing a Fixture

Edit `fixtures/users.js`. An entry describes the account: its `name`, and
optionally a `status` (`unconfirmed`, `invited`, `banned`), a `siteRole`
(`moderator`, `admin`), `multifactor: 'enabled'`, a `siteModeration` of its
profile flagged by an earlier entry, or the `notices` it has already seen.

The API ignores notices, but the client doesn't: it sends a user who hasn't
accepted the Terms of Service to `/accept-terms-of-service`, and shows the
welcome notice over any page until it's seen. So every fixture the
end-to-end tests log in as has `notices: NOTICES_SEEN`. Leave it off a
fixture meant for testing those flows.

## The Test Endpoints

`POST /test/user` and `DELETE /test/user/:id` belong to `TestController`.
They only exist when the server runs in development or on staging with a
`test.secret` in its configuration (`COMMUNITIES_TEST_SECRET` locally), and
only answer requests carrying both `X-Communities-Platform: test` and
`X-Communities-Test-Secret`, which `setup.js` adds.

`POST /test/user` can create accounts in any state registration can't:
already confirmed, banned, invited, a site moderator or admin, with MFA on,
with a flagged profile, or with notices seen. `DELETE /test/user/:id` only
deletes accounts whose email follows the fixture pattern.

Locally, `setup.js` reads the secret from `COMMUNITIES_TEST_SECRET` in the
same `.env` the server uses. For staging, pass it in the environment; see
[Integration Tests](integration-tests.md#staging).

## Staying Off Production

Every API request goes through `fetchEndpoint.js`, which refuses an
`API_ROOT` on production: `communities.social` or any host under it except
`staging.communities.social`. The end-to-end tests also check the browser's
`BASE_URL`, and abort any request the page makes to production.

## Email

The tests never read email, and the fixtures only have web notifications
on. Their addresses are at `mailinator.com` so anything staging does send
goes somewhere harmless.
