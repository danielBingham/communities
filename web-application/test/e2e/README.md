# End-to-End Tests

The end-to-end tests drive the web application in a real browser with
[Playwright](https://playwright.dev/), logged in as the same fixture users the
integration tests use. They automate the manual test cases in
[`documentation/testing/test-cases`](../../../documentation/testing/test-cases)
that need the UI. Like the integration tests, they run on Node's own test
runner, against your local environment or staging, never production.

## Running the tests

The first time, install Playwright's Chromium, from `web-application`:

```
npx playwright install chromium
```

(On Linux, `npx playwright install --with-deps chromium` also installs the
system libraries it needs.) Install it again whenever the `playwright`
version in `package.json` changes; the run tells you if it's missing.

Then, with the environment running (including the worker, which sends
notifications), from the repository root, run either suite (see
[Suites](#suites)):

```
npm run test:e2e:smoke-test    # the Smoke Test, on https://localhost:3000
npm run test:e2e               # a Full Regression: every test
```

To run one file, from `web-application`:

```
npm run test:e2e:single -- test/e2e/suites/Post/create.spec.js
```

To run some tests by name, add Node's `--test-name-pattern`; to run one
suite's tests, its tag filter:

```
npm run test:e2e:single -- --test-name-pattern="drafts" test/e2e/suites/Post/create.spec.js
npm run test:e2e:single -- --experimental-test-tag-filter=smoke-test test/e2e/suites/Post/create.spec.js
```

As with the integration tests, each run creates its fixture users and deletes
them at the end, with the test secret in your `.env`; see
[`../lib`](../lib/README.md). If you run the web application directly
rather than in Docker Compose, Node has to trust its self-signed certificate
for that: `NODE_EXTRA_CA_CERTS=$PWD/web-application/security/cert.pem npm run
test:e2e`. The browser accepts it on its own, for a server on your machine
only.

### Staging

```
COMMUNITIES_TEST_SECRET="$(aws ssm get-parameter --region us-east-1 --name /staging/test/secret \
  --with-decryption --query Parameter.Value --output text)" \
  npm run test:e2e:staging    # https://staging.communities.social
```

or `npm run test:e2e:smoke-test:staging` for the Smoke Test.

The tests post as their fixture users on staging, and delete what they post
when they're done.

### Options

Set these in the environment:

| Variable | |
| -------- | - |
| `BASE_URL` | The site to test. The npm scripts set it. |
| `API_ROOT` | Where the fixtures are created and the tests set up their data. Leave it unset: it follows `BASE_URL`, and must be on the same server. |
| `E2E_HEADED=true` | Show the browser instead of running it headless. |
| `E2E_SLOW_MO=500` | Pause this many milliseconds between browser actions, to follow along. |
| `E2E_BROWSER` | `chromium` (the default), `firefox` or `webkit`. Install the one you pick. So far the suite has only been run in Chromium. |
| `E2E_TIMEOUT` | Milliseconds to wait for the page before failing: 15000 locally, 30000 on staging. |
| `E2E_TRACE=off` | Don't record traces (see below). |

## When a test fails

A failed test leaves a screenshot of each page it had open, and a
[Playwright trace](https://playwright.dev/docs/trace-viewer) of each browser
window, in `test/e2e/results/<test name>/`. A trace replays the test step by
step, with the page, the console and the network at each one:

```
npx playwright show-trace test/e2e/results/<test name>/1-user1-trace.zip
```

Each run clears the last run's results; git ignores the folder.

## How the tests work

- **Fixtures and setup.** [`setup.js`](setup.js) checks where the tests are
  pointed and that the browser is installed, then runs the shared setup
  ([`../lib/setup.js`](../lib/setup.js)) that creates the fixture users.
- **Windows.** Each test file starts one browser. A test opens a window for
  each user it acts as with `openAs(key)` ([`lib/browser.js`](lib/browser.js)),
  each with its own cookies and local storage, so two users can be open at
  once, and nothing one test leaves behind (a draft, say) reaches the next.
  `cleanUp(t)` closes them after each test.
- **Logging in.** In the browser the session is a cookie, and the requests
  count against the API's rate limits, which the integration tests' requests
  skip. So `openAs()` logs each user in once per file, through the API as the
  client does, and later windows reuse that session. A test that logs out
  asks for a session of its own, `openAs(key, { fresh: true })`, so it
  doesn't end the shared one.
- **Setting up.** What a case starts from (a post to edit, a friendship) is
  set up through the API with the shared helpers in [`../lib`](../lib), and
  cleaned up in the file's `after`. The steps of the case itself happen in the
  browser.
- **Finding things.** The helpers in [`lib/`](lib) find elements the way a
  person or a screen reader does, by role and accessible name
  (`page.getByRole('button', { name: 'Edit Post' })`), not by class names.
  Each test posts text from `uniqueText()`, unique to the run, and finds its
  posts by it, since staging has everyone else's too.
- **Waiting.** Playwright waits for an element before acting on it. To check
  something the page will show eventually, wait for it
  (`locator.waitFor()`), or wrap a `node:assert` check in `eventually()`
  ([`lib/wait.js`](lib/wait.js)), which retries it. Before checking that
  something *isn't* on the page, wait for the page to have loaded, for
  example with `waitForPostList()`.
- **Staying off production.** The run refuses a `BASE_URL` or `API_ROOT` on
  production, and every window aborts any request the page makes to it
  ([`../lib/production.js`](../lib/production.js)).

## Suites

The tests are organized into two suites, like
[the manual tests](../../../documentation/testing/README.md), and each test
is tagged with the suite it's in:

| Tag | Tests | Run |
| --- | ----- | --- |
| `smoke-test` | The cases in a case file's Smoke Test section: the core interface and security cases. | `npm run test:e2e:smoke-test` |
| `full-regression` | The rest: the cases in its Manual Regression and Full Regression sections. | |

A Full Regression, as with the manual suites, runs both: every test, with
`npm run test:e2e`.

A test's suite is a tag on the test itself, from Node's test runner:

```
it('As a user, I should be able to make a post.', { tags: [ 'smoke-test' ] }, async function() {
```

The smoke test runs only the tests with that tag, with Node's
`--experimental-test-tag-filter=smoke-test`. Node's filters can't combine
tags with an "or", which is why a Full Regression runs without a filter
rather than with both tags. A filter also leaves out any test without its tag
and doesn't say so, so `checkSuite(t)` ([`lib/suites.js`](lib/suites.js)),
in every file's `afterEach`, fails a test that isn't tagged with exactly one
suite. Test tags are experimental in Node 24, which prints a warning to say
so.

## Organization

The files follow [the manual test cases](../../../documentation/testing/test-cases):
one file for each entity and action, so
`documentation/testing/test-cases/Post/update.md` is automated in
`suites/Post/update.spec.js`. In a file, an `it` for each case, named as the
case is and tagged with its suite, and a `describe` for each of the case
file's subsections (Post Drafts, say) that has cases in it.

Some cases are only partly automated. "(text only)" at the end of a test's
name means it runs the text steps of a case that also attaches an image, a
video or a link. Where an image case and a link case have the same text
steps, one test covers both, and a comment above it names the cases.

When you automate a case, tag its test with the suite of the section the
case is in, and mark it in its case file: `(covered: e2e)`, or
`(partially covered: e2e)` if part of it still needs testing by hand.

### What's covered

So far, the Post cases that only need text:

| Case file | Tests |
| --------- | ----- |
| `Post/create.md` | Making a post, mentioning friends, long strings, drafts (text only), mention notifications |
| `Post/read.md` | The Smoke Test's visibility cases, permalinks to posts you can't see |
| `Post/update.md` | Editing text, saving and cancelling edits (text only), edits reaching shares (text only), edit drafts (text only) |
| `Post/delete.md` | Deleting private posts, and public posts that have been shared (text only) |

Not yet: cases that attach images or videos, and cases with links (link
previews, YouTube embeds, link highlighting, link drafts). Any link typed into
a post makes the server scrape the site it points to, so those cases depend
on third-party sites.
