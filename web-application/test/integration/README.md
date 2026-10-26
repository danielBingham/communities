# Integration Tests

The integration tests call the API of a running web application, logged in
as the fixture users in
[`../lib/fixtures/users.js`](../lib/fixtures/users.js). They run against
your local environment or staging, never production.

The fixture users, the setup that creates them and the API helpers are
shared with the end-to-end tests, in [`../lib`](../lib/README.md).

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
[the test endpoints](../lib/README.md#the-test-endpoints)). Locally there's
nothing to do: the tests read `COMMUNITIES_TEST_SECRET` from the same `.env`
the server uses. Set it in the environment to override that.

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

## Organization

The suites are organized by controller and action, like
`suites/PostController/patchPost.spec.js`, and the test cases they automate
are marked `(covered: integration)` in
[the manual test cases](../../../documentation/testing/test-cases).
