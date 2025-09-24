## [Create User: Invitation](documentation/testing/test-cases/User/create/invitation.md)

Cases covering the User Registration flow.

### Pre-requisites

No pre-requisites.

### Cases

- [ ] Register a new user named John Doe with username `john-doe` (communities-john-doe@mailinator.com)
    - [ ] Attempt to register with too short a password.
        - [ ] Confirm validation error.
    - [ ] Attempt to register without checking Age Confirmation.
        - [ ] Confirm validation error.
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.

- [ ] Register a new user named Jane Doe (communities-jane-doe@mailinator.com)
    - [ ] Attempt to register with the username `john-doe`
        - [ ] Confirm validation error.
    - [ ] Register with the username `jane-doe`
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
