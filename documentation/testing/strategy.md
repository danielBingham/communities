# Testing Strategy

How the four kinds of tests fit together, and which suites run when.

## The Kinds of Tests

| Kind | Checks | Runs against | Where |
| ---- | ------ | ------------ | ----- |
| Unit | Functions and classes in isolation, with the database and other services mocked. | Nothing: no stack needed. | `packages/shared/test`, `packages/backend/test`, `web-application/test/unit` |
| Integration | The API: every endpoint's behavior, validation, permissions and errors. | A running stack, local or staging. | `web-application/test/integration` |
| End-to-end | The UI in a real browser, as a person uses it. | A running stack, local or staging. | `web-application/test/e2e` |
| Manual | Everything, by hand, from written cases. | Any environment, every supported browser and app. | `documentation/testing/test-cases` |

## The Cases Are the Catalog

The manual test cases describe everything the platform should do. The
integration and end-to-end tests automate them, are organized the same way
(by entity and action), and mark each case they automate with
`(covered: integration)` or `(covered: e2e)`. So the case files always say
what's tested and how, and what still needs a person.

Integration tests cover what the API decides (permissions, validation, what
comes back); end-to-end tests cover what needs the UI. A case can be
covered by both.

## The Suites

| Suite | What it is | When |
| ----- | ---------- | ---- |
| Smoke Test | The core interface and security cases. A day or less by hand; about 2 minutes automated. | Most features and releases, plus testing aimed at what changed. |
| Manual Regression | The Smoke Test plus every case only a person can run. | Before major releases. |
| Full Regression | Every case, on every supported browser and app. | Only with a good reason: it takes a long time by hand. |

The end-to-end tests are tagged with the same suites, so the automated
Smoke Test (`npm run test:e2e:smoke-test`) and Full Regression
(`npm run test:e2e`) match the manual ones.

## Where It's Heading

As a case file's cases are automated, its Manual Regression section goes
away: whatever isn't in the Smoke Test moves to Full Regression, marked
covered. Post's case files are done; the others will follow, until there
are only the Smoke Test and Full Regression, and running a Full Regression
mostly means running the automated tests.

## What a Change Needs

| Change | Tests |
| ------ | ----- |
| Logic in `packages/shared` or `packages/backend` (permissions, validation, services) | Unit tests. |
| An endpoint, or its behavior or permissions | Integration tests, and the cases in the case file, marked covered. |
| Something in the UI | End-to-end tests where the case can be automated; otherwise the case in its file, for the manual suites. |
| A migration | Running it forward and back locally, as in [Running Manual Tests](manual-tests.md#migrations). |

See also the [Definition of Done](../standards/definition-of-done.md).
