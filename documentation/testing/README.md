# Testing

How Communities is tested: unit, integration, end-to-end and manual tests,
how they fit together, and how to run and write each.

## The Kinds of Tests

| Kind | Run it with | Where it lives |
| ---- | ----------- | -------------- |
| Unit | `npm test` | `packages/*/test`, `web-application/test/unit` |
| Integration | `npm run test:integration` (local stack running) | `web-application/test/integration` |
| End-to-end | `npm run test:e2e` or `npm run test:e2e:smoke-test` (local stack running) | `web-application/test/e2e` |
| Manual | By hand, from `test-index.md` | `documentation/testing/test-cases` |

## In This Directory

| File | Read it when |
| ---- | ------------ |
| [strategy.md](strategy.md) | Deciding which tests a change needs, or which suite to run. |
| [unit-tests.md](unit-tests.md) | Running or writing unit tests. |
| [test-library.md](test-library.md) | Using or changing the fixture users, API helpers or test endpoints the integration and end-to-end tests share. |
| [integration-tests.md](integration-tests.md) | Running the integration tests, locally or on staging. |
| [writing-integration-tests.md](writing-integration-tests.md) | Writing an integration test. |
| [e2e-tests.md](e2e-tests.md) | Running the end-to-end tests, or debugging a failure. |
| [writing-e2e-tests.md](writing-e2e-tests.md) | Writing an end-to-end test. |
| [manual-tests.md](manual-tests.md) | Running a manual test run for a feature or release. |
| [writing-test-cases.md](writing-test-cases.md) | Writing or changing a manual test case, or marking one covered. |
| [test-index.md](test-index.md) | The list of every case file, copied to start a manual run. |
| [test-cases/](test-cases) | The manual test cases, by entity and action. |
| [test-runs/](test-runs) | Records of past manual test runs. |

`test-index.md` and the case files link to each other by paths from the
repository root, since they're copied into test runs at other depths.
