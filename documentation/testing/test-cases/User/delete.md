## [Delete User](documentation/testing/test-cases/User/delete.md)

Cases covering user deletion. 

### Pre-requisites

None.

### Cases

- [ ] As a user, I can delete my account.
    - As an unauthenticated user:
        - Register a new user account.
        - Delete account.
            - **Confirm account successfully deletes.**

- [ ] As a user with MFA, I can delete my account.
    - As an unauthenticated user:
        - Register a new user account.
        - Turn on Multifactor Authentication.
        - Delete account.
            - **Confirm account successfully deletes.**
