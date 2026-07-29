## [Delete User](documentation/testing/test-cases/User/delete.md)

Cases covering user deletion.

### Smoke Test

#### Pre-requisites

None.

#### Cases

- [ ] As a user, I can delete my account.
    - As an unauthenticated user:
        - Register a new user account.
        - Delete account.
            - **Confirm account successfully deletes.**
            - **Confirm the account can no longer be logged into.**

### Manual Regression

#### Pre-requisites

- [ ] An authenticator app is available to enrol for the MFA case.

#### Cases

- [ ] As a user with MFA, I can delete my account.
    - As an unauthenticated user:
        - Register a new user account.
        - Turn on Multifactor Authentication.
        - Delete account.
            - **Confirm account successfully deletes.**
            - **Confirm the account can no longer be logged into.**

### Full Regression

#### Pre-requisites

None.

The user deletion endpoint is not yet covered by the Integration suite.  All
deletion cases are defined in the Smoke Test and Manual Regression sections
above.
