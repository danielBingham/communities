# Integration Tests

The integration tests call the API of a running web application, logged in
as the users in [`fixtures/users.js`](fixtures/users.js). They run against
your local environment or staging, never production.

## 1. Seed the fixture users

The fixture users have to exist, in the state `fixtures/users.js` describes,
before the tests run. The seed writes them straight to the database, so there's
nothing to register or confirm by email. Run it from the repository root:

```
npm run test:integration:seed
```

It creates any fixture user that's missing and puts the rest back the way
`fixtures/users.js` describes them: password, status, site role, settings,
privacy, failed login attempts, multi-factor authentication, profile picture
(none) and profile moderation. Running it before every test run is fine. It doesn't touch other
users, or anything the tests create (groups, posts, friendships), which the
tests clean up after themselves.

It connects to the database the web application uses, with the same
configuration file (`server/config/index.development.js`), but loads only the
`database` values from it. With Docker Compose, that database is `postgres`
inside the containers but `localhost` from your machine, so run the seed from
your machine with:

```
COMMUNITIES_DATABASE_HOST=localhost npm run test:integration:seed
```

(If your `index.development.js` reads the database host from Parameter Store,
change its source to `env:COMMUNITIES_DATABASE_HOST` to do the same.)

### Staging

```
COMMUNITIES_ENVIRONMENT_NAME=<staging's Parameter Store path> \
AWS_REGION=<region> AWS_ACCESS_KEY_ID=<key> AWS_SECRET_ACCESS_KEY=<secret> \
npm run test:integration:seed:staging
```

This uses `server/config/index.staging.js`, so the database values come from
Parameter Store, and your machine has to be able to reach the staging
database. The seed refuses to run with the production configuration.

## 2. Run the tests

From the repository root:

```
npm run test:integration            # https://localhost:3000
npm run test:integration:staging    # https://staging.communities.social
```

To run one file, from `web-application`:

```
npm run test:integration:single -- test/integration/suites/UserController/getUser.spec.js
```

## Email

The tests never read email, and the fixture users have email notifications
turned off. Their addresses are `@mailinator.com` addresses so that anything
staging does send them goes somewhere harmless.
