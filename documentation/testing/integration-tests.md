# Integration Tests

The integration tests call the API of a running web application, logged in
as the fixture users, and check what it does: responses, validation,
permissions, errors. They run on Node's own test runner (`node:test`),
against your local stack or staging, never production. To write one, see
[Writing Integration Tests](writing-integration-tests.md).

**Code:** `web-application/test/integration/`, `web-application/test/lib/`

## Running Them

With the local stack running, from the repository root:

```
npm run test:integration            # against https://localhost:3000
```

To run one file, from `web-application`:

```
npm run test:integration:single -- test/integration/suites/UserController/getUser.spec.js
```

Each run creates the fixture users it needs and deletes them again, through
endpoints that need the server's test secret (see
[the test endpoints](test-library.md#the-test-endpoints)). Locally there's
nothing to set up: the tests read `COMMUNITIES_TEST_SECRET` from the same
`.env` the server uses. Set it in the environment to override that.

If you run the web application without Docker, Node has to trust its
certificate: see [Running Without Docker](../getting-started/running-without-docker.md).

Files run one at a time (`--test-concurrency 1`), since they share the
fixture users.

### Staging

Staging's secret is in Parameter Store, at `/staging/test/secret`, for those
with access. Pass it in `COMMUNITIES_TEST_SECRET`:

```
COMMUNITIES_TEST_SECRET="$(aws ssm get-parameter --region us-east-1 --name /staging/test/secret \
  --with-decryption --query Parameter.Value --output text)" \
  npm run test:integration:staging    # https://staging.communities.social
```

The tests only read your `.env` for a server on your own machine, so your
local secret is never sent to staging.

## Organization

The suites are organized by controller and route handler:
`suites/PostController/patchPost.spec.js` tests `PATCH /post/:id`. A handler
with many cases gets a directory instead (`suites/PostController/getPosts/`).
The test cases they automate are marked `(covered: integration)` in
[the manual test cases](test-cases).

| Controller | Suites |
| ---------- | ------ |
| `AuthenticationController` | Logging in and out, and the session. |
| `CommentReactionController` | Reacting to comments, and the relations that come back. |
| `GroupController`, `GroupMemberController` | Groups and membership. |
| `NewsController`, `PageController` | News posts, and the page metadata rendered for them. |
| `PostController` | Posts. |
| `UserController`, `UserRelationshipController` | Users and friendships. |

Endpoints without a suite yet are still covered by the manual test cases.
