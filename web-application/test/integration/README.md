# Integration Tests

The integration tests call the API of a running web application, logged in
as the users in [`fixtures/users.js`](fixtures/users.js). They run against
your local environment or staging, never production.

## Running the tests

From the repository root:

```
npm run test:integration            # https://localhost:3000
```

To run one file, from `web-application`:

```
npm run test:integration:single -- test/integration/suites/UserController/getUser.spec.js
```

Each run creates the users it needs and deletes them again, through
endpoints that need the server's test secret (its `test.secret`; see
[The test endpoints](#the-test-endpoints)). Locally there's nothing to do:
the tests read `COMMUNITIES_TEST_SECRET` from the same `.env` the server
uses. Set it in the environment to override that.

### Staging

Staging's secret is in Parameter Store, at `/staging/test/secret`. Pass it in
`COMMUNITIES_TEST_SECRET`:

```
COMMUNITIES_TEST_SECRET="$(aws ssm get-parameter --region us-east-1 --name /staging/test/secret \
  --with-decryption --query Parameter.Value --output text)" \
  npm run test:integration:staging    # https://staging.communities.social
```

The tests only read your `.env` for a server on your own machine, so your
local secret is never sent to staging.

## The fixture users

[`setup.js`](setup.js) runs once before the first test file and once after
the last (all three scripts pass it to Node's test runner with
`--test-global-setup`). Before the tests, it creates every user in
`fixtures/users.js` through `POST /test/user`, each with:

- a username and email unique to this run: `test-<run>-<key>` and
  `communities-test-<run>-<n>@mailinator.com`,
- a random password, which only this run ever knows.

The MFA fixture, `user-mfa`, also gets a TOTP secret and ten recovery codes,
as if it had enrolled an authenticator app. `lib/multifactor.js` generates
tokens from the secret; each recovery code works once.

The test files get them from `getFixture(key)` in
[`lib/fixtures.js`](lib/fixtures.js), id, password and MFA secret included;
`loginAs(key)` in `lib/authentication.js` logs in with them. The runner hands
them to each test process in an environment variable, so they're never
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
'enabled'`, or a `siteModeration` of its profile flagged by an earlier entry.

## The test endpoints

`POST /test/user` and `DELETE /test/user/:id` belong to the web
application's `TestController` (`server/controllers/TestController.js`).
They exist only when the server runs in local development or on staging with
a `test.secret` in its configuration: `env:COMMUNITIES_TEST_SECRET` in the
local example configuration, `/test/secret` in Parameter Store for staging
(and the Parameter Store example). They only answer requests that carry both:

- `X-Communities-Platform: test`, as all the tests' requests do;
- `X-Communities-Test-Secret`, the secret, which `setup.js` adds.

Unlike registration, `POST /test/user` can create accounts that are already
confirmed, banned, invited, a site moderator or admin, have multi-factor
authentication on, or have their profile flagged. `DELETE /test/user/:id`
only deletes accounts whose email follows the fixture pattern, so it can't
delete anyone else.

## Email

The tests never read email, and the fixture users only have web
notifications on (no email, desktop or mobile). Their addresses are
`@mailinator.com` addresses so that anything staging does send them goes
somewhere harmless.
