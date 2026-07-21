# Test Case Definitions

This directory includes definitions for our manual test cases.  The test cases
are organized by Entity (Controller), Action (CRUD action), and in some cases
specific cases, actions, or situations.

Each file describes the tests covered with in, contains any pre-requisites for
them, and then has two sections of test cases: "Smoke Test" and "Full
Regression".

The "Smoke Test" cases are the cases we should run during a
"Smoke Test" and before every significant release. They are cases not covered
by the automated integration test suite, or that are specific to the frontend
interface or to particular devices.

The "Full Regression" test cases are the detailed scenario coverage of every
possible happy and error path in the app.  Many of them are covered by the
integration test suite, and the ones that aren't don't need to be run on every
release, just on a full regression.

## Example Case Definition File

A test case definition file:

```
## [Action Entity](documentation/testing/test-cases/Entity/action.md)

Cases covering Actions performed on the Entity system, including...

### Pre-requisites

- [ ] User1 has been registered.

### Smoke Test

- [ ] As a user, I can perform action on entity.
    - As unauthenticated user:
        - Go to the root `/` page.
        - Enter User1's email and password into the login form.
            - **Confirm authentication by navigating, posting, viewing some posts.**
        - Log out.


### Full Regression

- [ ] As a user, I can perform some other action on entity.  (covered: integration)
    - As unauthenticated user:
        - Go to the root `/` page.
        - Enter User1's email and password into the login form.
            - **Confirm authentication by navigating, posting, viewing some posts.**
        - Log out.
```

The header should name the file by Entity and Action and link back to the file
(so that it can be copied and pased into a smoke test or regression file).

The `Pre-requisites` section defines any necessary pre-reqs, such as ensuring
users have been created.

The `Smoke Test` section defines the smoke tests for that particular suite.

The `Full Regression` section defines additional tests for a full regression
test.  To run a full regression, you will need to run both the Smoke Tests and
the Full Regression.

If tests have additional coverage in our automated tests suites, they are
marked as such parenthetically, eg. `(covered: e2e, integration)`.
