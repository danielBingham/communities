# End-to-End Tests

The end-to-end tests drive the web application in a real browser with
[Playwright](https://playwright.dev/), logged in as the same fixture users
the integration tests use. They automate the manual test cases that need
the UI. They run on Node's own test runner, against your local stack or
staging, never production. To write one, see
[Writing End-to-End Tests](writing-e2e-tests.md).

**Code:** `web-application/test/e2e/`, `web-application/test/lib/`

## Running Them

The first time, install Playwright's Chromium, from `web-application`:

```
npx playwright install chromium
```

(On Linux, `npx playwright install --with-deps chromium` also installs the
system libraries it needs.) Install it again whenever the `playwright`
version in `package.json` changes; the run tells you if it's missing.

Then, with the local stack running, including the worker (which processes
images and videos and sends notifications), from the repository root:

```
npm run test:e2e:smoke-test    # the Smoke Test: about 2 minutes
npm run test:e2e               # a Full Regression, every test: about 10 minutes
```

To run one file, or some tests in it, from `web-application`:

```
npm run test:e2e:single -- test/e2e/suites/Post/create.spec.js
npm run test:e2e:single -- --test-name-pattern="drafts" test/e2e/suites/Post/create.spec.js
npm run test:e2e:single -- --experimental-test-tag-filter=smoke-test test/e2e/suites/Post/create.spec.js
```

Each run creates its fixture users and deletes them at the end; see
[The Shared Test Library](test-library.md). If you run the web application
without Docker, Node has to trust its certificate:
`NODE_EXTRA_CA_CERTS=$PWD/web-application/security/cert.pem npm run test:e2e`.
The browser accepts it on its own, for a server on your machine only.

### Preflight Checks

Before it starts, a run checks that the server can do what the tests need,
and stops, saying what to fix, if it can't:

- **The WebSocket host ends in `/socket`.** The post form learns that an
  attached image or video has been processed over the WebSocket, which the
  server only takes at `/socket`: `COMMUNITIES_WS_HOST=wss://localhost:3000/socket`
  in your `.env`. A `.env` copied from an older example needs `/socket`
  added, and the web application restarted.
- **Video uploads are enabled.** The post form only offers "Add Video" with
  the `video-uploads` feature on, which it is in a new local database.

### Staging

```
COMMUNITIES_TEST_SECRET="$(aws ssm get-parameter --region us-east-1 --name /staging/test/secret \
  --with-decryption --query Parameter.Value --output text)" \
  npm run test:e2e:staging    # https://staging.communities.social
```

or `npm run test:e2e:smoke-test:staging` for the Smoke Test. The tests post
as their fixture users on staging, and delete what they post when they're
done.

### Options

Set these in the environment:

| Variable | |
| -------- | - |
| `BASE_URL` | The site to test. The npm scripts set it. |
| `API_ROOT` | Where fixtures are created and tests set up their data. Leave it unset: it follows `BASE_URL`, and must be the same server. |
| `E2E_HEADED=true` | Show the browser instead of running headless. |
| `E2E_SLOW_MO=500` | Pause this many milliseconds between browser actions, to follow along. |
| `E2E_BROWSER` | `chromium` (the default), `firefox` or `webkit`. Install the one you pick. So far the suite has only been run in Chromium. |
| `E2E_TIMEOUT` | Milliseconds to wait for the page before failing: 15000 locally, 30000 on staging. |
| `E2E_MEDIA_TIMEOUT` | Milliseconds to wait for an image or video to upload and process: 180000 locally, 300000 on staging. The test video takes about 40 seconds locally. |
| `E2E_TRACE=off` | Don't record traces. |

## When a Test Fails

A failed test leaves a screenshot of each page it had open, and a
[Playwright trace](https://playwright.dev/docs/trace-viewer) of each browser
window, in `test/e2e/results/<test name>/`. A trace replays the test step
by step, with the page, the console and the network at each one:

```
npx playwright show-trace test/e2e/results/<test name>/1-user1-trace.zip
```

Each run clears the last run's results; git ignores the folder.
