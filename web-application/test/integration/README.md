# Integration Tests

The integration tests call the API of a running web application, logged in
as the users in [`fixtures/users.js`](fixtures/users.js). They run against
your local environment or staging, never production.

## Running the tests

From the repository root:

```
npm run test:integration            # https://localhost:3000
npm run test:integration:staging    # https://staging.communities.social
```

To run one file, from `web-application`:

```
npm run test:integration:single -- test/integration/suites/UserController/getUser.spec.js
```

There's nothing to set up first: each run creates the users it needs and
deletes them again.

## The fixture users

[`setup.js`](setup.js) runs once before the first test file and once after
the last (all three scripts pass it to Node's test runner with
`--test-global-setup`). Before the tests, it creates every user in
`fixtures/users.js` through `POST /test/user`, each with:

- a username and email unique to this run: `test-<run>-<key>` and
  `communities-test-<run>-<n>@mailinator.com`,
- a random password, which only this run ever knows.

The test files get them from `getFixture(key)` in
[`lib/fixtures.js`](lib/fixtures.js), id and password included; `loginAs(key)`
in `lib/authentication.js` logs in with them. The runner hands them to each
test process in an environment variable, so the passwords are never written
anywhere.

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
They exist only when the server runs in local development or on staging, and
only answer requests whose `X-Communities-Platform` header is `test`, as the
tests' requests are. Unlike registration, `POST /test/user` can create
accounts that are already confirmed, banned, invited, a site moderator or
admin, have multi-factor authentication on, or have their profile flagged.
`DELETE /test/user/:id` only deletes accounts whose email follows the
fixture pattern, so it can't delete anyone else.

## Email

The tests never read email, and the fixture users have email notifications
turned off. Their addresses are `@mailinator.com` addresses so that anything
staging does send them goes somewhere harmless.
