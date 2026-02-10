## [Create User: Email Confirmation](documentation/testing/test-cases/User/create/registration.md)

Cases covering the Email Confirmation flow. 

### Pre-requisites

No pre-requisites.

### Cases

#### Success cases

- [ ] Users can confirm their email by following the link in the email.
    1. Register a new user.
    2. Check the email you registered.
        1. Confirm email arrives.
        2. Confirm it a link.
    3. Click the link in the email.
        1. Confirm user is confirmed.
        2. Confirm TOS page loads.

- [ ] Users can confirm their email by copying and pasting the token into the form.
    1. Register a new user.
    2. Check the email you registered.
        1. Confirm email arrives.
        2. Confirm it contains a token.
    3. Click copy the token into the form.  Click Confirm.
        1. Confirm the user is confirmed.
        2. Confirm the TOS page loads.

- [ ] Users can request a new confirmation email from the email confirmation form.
- [ ] Users can logout from the email confirmation form.
- [ ] Users can confirm their email by following the link in the email when they are logged out.
- [ ] Users can log back in and confirm their email by copying and pasting the token from the email.

#### Error cases

- [ ] Users are shown an error when they follow a link with an invalid token.
- [ ] Users are shown an error when they manually enter an invalid token.
- [ ] Users are shown an error when they attempt to request a new confirmation while already confirmed.
- [ ] Users are simply forwarded to TOS when they attempt to re-confirm after already confirming.
