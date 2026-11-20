# Writing End-to-End Tests

How the end-to-end tests work, and the standards every test follows so they
read alike and say plainly what they check. Running them is in
[End-to-End Tests](e2e-tests.md).

**Code:** `web-application/test/e2e/suites/`, `web-application/test/e2e/lib/`

## How They Work

- **Windows.** Each test file starts one browser. A test opens a window for
  each user it acts as with `openAs(key)` (`lib/browser.js`), each with its
  own cookies and local storage, so two users can be open at once and
  nothing one test leaves behind (a draft, say) reaches the next.
  `cleanUp(t)` closes them after each test.
- **Logging in.** In the browser the session is a cookie, and requests
  count against the API's rate limits. So `openAs()` logs each user in once
  per file, through the API as the client does, and later windows reuse that
  session. A test that logs out asks for its own session,
  `openAs(key, { fresh: true })`, so it doesn't end the shared one.

## Organization

The files follow the manual test cases: one file per entity and action, so
`documentation/testing/test-cases/Post/update.md` is automated in
`suites/Post/update.spec.js`. In a file, an `it` for each case, named as the
case is, and a `describe` for each subsection of the case file (Post Drafts,
say) that has cases in it.

## Tags

Each test is tagged with every suite it's in: `full-regression` always, and
`smoke-test` too if its case is in the case file's Smoke Test section.

```javascript
it('As a user, I should be able to make a post.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
it('As a user, I should be able to post long strings without breaking the app.', { tags: [ 'full-regression' ] }, async function() {
```

The Smoke Test runs with `--experimental-test-tag-filter=smoke-test`; a Full
Regression runs every test without a filter. A filter silently leaves out
any untagged test, so `checkSuite(t)` (`lib/suites.js`), in every file's
`afterEach`, fails any test not tagged `full-regression`. Tags for narrower
suites (`permissions`, say) can go alongside. Tags are experimental in Node
24, so the scripts run with `--disable-warning=ExperimentalWarning`.

## Set Up Through the API, Act in the Browser

What a case starts from (a post to edit, with its image or link, a
friendship) is set up through the API with the shared helpers in
`test/lib`, and cleaned up in the file's `after`. The case's own steps
happen in the browser. Each test posts text from `uniqueText()`, unique to
the run, since staging has everyone else's posts too.

A fixture's browser session keeps the settings it logged in with. A test
that changes them through the API first opens its windows with
`openAs(key, { fresh: true })`, and puts the settings back when it's done.

## Wait for the Page, Then Assert on It

Each outcome a case confirms is an assertion from `node:assert`: what
should be on the page *and* what shouldn't. Waiting is only for the page to
be ready to check; never let a wait be the check.

```javascript
// Wait for the page to load...
await posts.waitForPermalinkPage(page)

// ...then assert on what it shows: the post, with the edit...
const post = posts.getPostById(page, original.id)
assert.equal(await posts.getPostContent(post).innerText(), edited)

// ...and without the text it had before.
assert.equal(await page.getByText(original.content).count(), 0)
```

- **Waiting.** Wait for what tells you the page has loaded, not for the
  thing you're about to check: `waitForPostList()`,
  `waitForPermalinkPage()`, `page.waitForURL()` after navigating, or
  `locator.waitFor()` on something that loads separately.
  `waitForLinkPreview()` waits for the post form's preview; `waitForMedia()`
  waits for a post's image or video to load.
- **Asserting.** Compare what the page shows to exactly what you expect:
  `innerText()` for text, `inputValue()` for a field, `getAttribute()` for
  a link. `assert.equal(await locator.count(), 1, message)` says what's
  missing better than a timeout. `count()` doesn't wait, so to assert
  something is absent, the page must have loaded first.
- **Things that settle on their own time** (a menu closing, a
  notification the worker sends): retry the assertion itself with
  `eventually()` (`lib/wait.js`).
- **Every "Confirm..."** in the case is an assertion in the test.
- **Actions wait for themselves.** Helpers that act (`submitPost()`,
  `saveEdit()`, `deletePost()`, `react()`, `attachMedia()`) wait for their
  action to finish, and fail with what the page says if it doesn't.
  `chooseFiles()` is the exception: it only picks files, for tests of files
  that should be refused.

## Find What You Check by What Doesn't Change

Find an element by something that doesn't depend on the answer. A post set
up through the API has an id: get it with `getPostById()` and assert its
content. Finding it with `getPostByText()` and the text you expect would
only find it if the test had already passed. For a post made in the
browser, find it by the unique text it was given, then assert its content
in full.

Helpers in `lib/` find elements by role and accessible name
(`page.getByRole('button', { name: 'Edit Post' })`), the way a person or a
screen reader does, and only fall back on markup (an id, a class) when
there's nothing else, with a comment saying why.

## Name Helpers for What They Do

A helper that gets something from the page without acting is named
`get...()`: `getPostById()` returns a Locator, `getPermalink()` a value. A
helper named for an action (`openPostForm()`, `editPost()`) does it.
Assertions stay in the tests.

## Media and Links

- **Images and videos** are the files in `test/lib/fixtures/assets/`, named
  by `getMedia(key)`: three `.jpg` photos, a `.png`, a large `.mp4` and a
  short `.mov`. `getCorruptedMedia(key)` makes a corrupted copy in memory.
  Tests attach them through the file chooser (`attachMedia()`,
  `lib/media.js`) and wait for the worker to process them. Processing
  scales images and videos to 650 pixels wide, which is how the tests tell
  what's shown has been processed.
- **Links** are to two posts on the Communities News page (`NEWS_LINKS`).
  The server fetches each once per environment for its preview. They're on
  production, which the windows won't load, so a test that follows a link
  checks the new tab asked for it rather than what it shows.
- **YouTube** links aren't tested, since they'd depend on YouTube.

## Finishing Up

Mark each case you automated `(covered: e2e)`, or `(partially covered:
e2e)` if part still needs a person, in its case file (see
[Writing Test Cases](writing-test-cases.md#coverage-markers)).
