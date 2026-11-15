# Writing Test Cases

The format of the manual test case files in `test-cases/`, which are also
the catalog of behavior the automated tests are organized around.

**Code:** `documentation/testing/test-cases/`,
`documentation/testing/test-index.md`

## Organization

Case files are organized by entity and action, matching the controllers:
`test-cases/Post/create.md`, `test-cases/PostComment/update.md`. Where the
action isn't the natural grouping, another is used
(`test-cases/User/update/mfa.md`, `test-cases/Authentication/authentication.md`).
Every case file has a heading in `test-index.md`; add one when you add a
file.

## A Case File

- A heading naming the entity and action, linking to the file's own path
  (from the repository root, so it still works when copied into a run).
- A sentence saying what the cases cover.
- A section per suite: **Smoke Test**, **Manual Regression**, **Full
  Regression**. Each case is in exactly one suite, never repeated, and each
  suite builds on the one before.
- In each suite, a **Pre-requisites** subsection (the users and data the
  cases need), then the cases, grouped into subsections by the feature they
  touch.

Once a file's cases are automated, it has just two sections, **Smoke Test**
and **Full Regression**. So far that's Post's files. See
[Testing Strategy](strategy.md).

## The Suites

- **Smoke Test**: the core interface and security cases covering the most
  used and most critical parts of the app. The whole suite can be run in a
  day or less.
- **Manual Regression**: the rest of the cases that need a person, which
  the automated tests don't cover.
- **Full Regression**: the cases the automated tests cover, kept as manual
  cases so the automated tests themselves can be checked by hand. In a file
  whose cases are automated, it's every case not in the Smoke Test, most
  marked covered and a few (unmarked) still run by hand.

## Feature Cases

A feature case is a user story, with indented steps beneath it: the user to
act as, then each action, then the expected outcome in bold.

```
- [ ] As a user, I can do the action this test case describes.
    - As the user who should execute the action:
        - Perform an action.
            - **Confirm the expected outcome of the action.**
        - Perform a second action.
            - **Confirm the expected outcome of the second action.**
    - As a different user:
        - Perform an action.
            - **Confirm the expected outcome of the action.**
```

## Permission Cases

A permission case is one line: who, and the action they can or can't take,
bolded. They make permission matrices quick to write and read.

```
- [ ] A user **can** view a public post.
- [ ] A friend of user **can** view user's private post.
- [ ] A non-friend of user **cannot** view user's private post.
```

## Coverage Markers

A case covered by the automated tests is marked at the end of its first
line:

- `(covered: integration)`, `(covered: e2e)` or `(covered: e2e,
  integration)`: fully automated.
- `(partially covered: e2e)`: part of it is automated, and the rest still
  needs running by hand.

When you automate a case, add its marker in the same change.

## Example

```
## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

Cases covering logging in, logging out, and resetting a password.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been registered.

#### Log in

- [ ] As a user, I can log in through the splash page.
    - As an unauthenticated user:
        - Go to the root `/` page.
        - Enter User1's email and password into the login form.
            - **Confirm you're logged in by navigating and viewing posts.**

### Full Regression

#### Pre-requisites

- [ ] User1 has been registered.

#### Log in

- [ ] As a user, I can only log in with the correct password. (covered: integration)
    - As an unauthenticated user:
        - Attempt to log in with User1's email and an incorrect password.
            - **Confirm login fails.**
```
