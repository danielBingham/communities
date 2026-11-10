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
- **Staying off production.** The run refuses a `BASE_URL` or `API_ROOT` on
  production, and every window aborts any request the page makes to it
  ([`../lib/production.js`](../lib/production.js)).

## Writing tests

The standards every end-to-end test follows, so they read alike and say
plainly what they check.

### Wait for the page, then assert on it

A test states each outcome it expects with an assertion from `node:assert`:
what should be on the page *and* what shouldn't. Waiting is only for the page
to be ready to check. A `waitFor()` that times out does fail a test, but it
doesn't say what was expected, and a reader can't tell a wait for a page to
load from a check of what it shows. So never let a wait be the check:

```
// Wait for the page to load...
await posts.waitForPermalinkPage(page)

// ...then assert on what it shows: the post, with the edit...
const post = posts.getPostById(page, original.id)
assert.equal(await posts.getPostContent(post).innerText(), edited)

// ...and without the text it had before.
assert.equal(await page.getByText(original.content).count(), 0)
```

- **Waiting.** Wait for what tells you the page has loaded, not for the thing
  you're about to check: `waitForPostList()` for a feed or a profile,
  `waitForPermalinkPage()` for a post's page, `page.waitForURL()` after a
  navigation, or `locator.waitFor()` on something that loads separately (the
  post inside a share, the list of mention suggestions).
- **Asserting.** Then compare what the page shows to exactly what you expect:
  `assert.equal(await locator.innerText(), expected)` for text,
  `inputValue()` for a form field, `getAttribute()` for a link. To assert
  something is on the page, `assert.equal(await locator.count(), 1, message)`
  before reading it says what's missing better than a timeout would. To
  assert it isn't, `count()` should be 0, and since `count()` doesn't wait,
  the page has to have loaded first, or the check passes because nothing has
  arrived yet.
- **Things that change on their own time.** When something settles after an
  action with nothing to wait for (a menu closing, names in mentions loading,
  a notification the worker sends), retry the assertion itself with
  `eventually()` ([`lib/wait.js`](lib/wait.js)) rather than waiting for the
  outcome and asserting it afterward.
- **Every outcome the case confirms.** Each "Confirm..." in the case file is
  an assertion in the test.
- **Actions wait for themselves.** Helpers that act (`submitPost()`,
  `saveEdit()`, `deletePost()`, `react()`) wait for their action to finish
  (the navigation, the post going), so the next step doesn't start halfway
  through. That's not the test's check: after one, the test still asserts
  the outcome.

### Find what you check by what doesn't change

To check what something shows, find it by something that doesn't depend on
the answer. A post a test set up through the API has an id: get it with
`getPostById()` and assert its content. Getting it with `getPostByText()` and
the text you expect would only find it if the test had already passed. For a
post the test makes in the browser, whose id it doesn't know, find it by the
unique text it was given, and then assert its content in full.

The helpers in [`lib/`](lib) find elements the way a person or a screen
reader does, by role and accessible name
(`page.getByRole('button', { name: 'Edit Post' })`), and only fall back on
markup (an id, a class) when there's nothing else to go on, with a comment
saying why.

### Name helpers for what they do

A helper that gets something from the page, without doing anything to it, is
named `get...()`, like Playwright's own `getByRole()`: `getPostById()` and
`getPostFormTextbox()` return a Locator to act on or check, and
`getPermalink()` a value read from the page. A helper named for an action
(`openPostForm()`, `editPost()`) does it. Assertions stay in the tests.

### Set up through the API, act in the browser

What a case starts from (a post to edit, a friendship) is set up through the
API with the shared helpers in [`../lib`](../lib) and cleaned up in the
file's `after`. The steps of the case itself happen in the browser. Each test
posts text from `uniqueText()`, unique to the run, since staging has
everyone else's posts too.

## Suites

The tests are organized into two suites, like
[the manual tests](../../../documentation/testing/README.md), and as with
those, a Full Regression includes the Smoke Test. Each test is tagged with
every suite it's in:

| Tag | Tests | Run |
| --- | ----- | --- |
| `full-regression` | Every test. | `npm run test:e2e` |
| `smoke-test` | The cases in a case file's Smoke Test section: the core interface and security cases. | `npm run test:e2e:smoke-test` |

The tags go on the test itself, with Node's test runner:

```
it('As a user, I should be able to make a post.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
it('As a user, I should be able to post long strings without breaking the app.', { tags: [ 'full-regression' ] }, async function() {
```

The smoke test runs only the tests tagged `smoke-test`, with Node's
`--experimental-test-tag-filter=smoke-test`. A Full Regression runs every
test without a filter; the `full-regression` tag is there so each test says
which suites it's in. A filter leaves out any test without its tag and
doesn't say so, so `checkSuite(t)` ([`lib/suites.js`](lib/suites.js)), in
every file's `afterEach`, fails any test that isn't tagged `full-regression`,
which catches one someone forgot to tag. Tags for narrower suites
(`permissions`, say) can go alongside the others.

Test tags are experimental in Node 24. The `test:e2e` scripts run Node with
`--disable-warning=ExperimentalWarning`, so it doesn't warn about that on
every run; other warnings, deprecations included, still show.

## Organization

The files follow [the manual test cases](../../../documentation/testing/test-cases):
one file for each entity and action, so
`documentation/testing/test-cases/Post/update.md` is automated in
`suites/Post/update.spec.js`. In a file, an `it` for each case, named as the
case is and tagged with its suites, and a `describe` for each of the case
file's subsections (Post Drafts, say) that has cases in it.

Some cases are only partly automated. "(text only)" at the end of a test's
name means it runs the text steps of a case that also attaches an image, a
video or a link. Where an image case and a link case have the same text
steps, one test covers both, and a comment above it names the cases.

When you automate a case, tag its test `full-regression`, and `smoke-test`
as well if the case is in its file's Smoke Test section, and mark it in its
case file: `(covered: e2e)`, or `(partially covered: e2e)` if part of it
still needs testing by hand.

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
