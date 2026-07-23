## [Create User: Registration](documentation/testing/test-cases/User/create/registration.md)

Cases covering the User Registration flow.

### Pre-requisites

No pre-requisites.

### Smoke Test

- [ ] As a new user, I can register an account.
    - As unauthenticated user:
        - Go to the registration form and register a new user named John Doe
          with username `john-doe` (communities-john-doe@mailinator.com).
        - Attempt to register with too short a password.
            - **Confirm validation error.**
        - Attempt to register without checking Age Confirmation.
            - **Confirm validation error.**
        - Complete the form correctly and submit.
            - **Confirm registration succeeds.**
        - Confirm the email address.
        - Accept the Terms of Service.
        - Skip "Pay What you Can".
            - **Confirm landed in the app as an authenticated user.**
        - Turn off all email notifications.

### Manual Regression

- [ ] As a new user, I cannot register with a username that is already taken.
    - As unauthenticated user:
        - Go to the registration form and begin registering Jane Doe
          (communities-jane-doe@mailinator.com).
        - Attempt to register with the username `john-doe`.
            - **Confirm validation error.**
        - Change the username to `jane-doe` and submit.
            - **Confirm registration succeeds.**
        - Confirm the email address.
        - Accept the Terms of Service.
        - Skip "Pay What you Can".
            - **Confirm landed in the app as an authenticated user.**
        - Turn off all email notifications.

### Full Regression

The registration endpoint is not yet covered by the Integration suite.  All
registration cases are defined in the Smoke Test and Manual Regression
sections above.
