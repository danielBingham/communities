## [Create User: Email Confirmation](documentation/testing/test-cases/User/create/email-confirmation.md)

Cases covering the Email Confirmation flow.

### Pre-requisites

No pre-requisites.

### Smoke Test

- [ ] As a user, I can confirm my email by following the link in the email.
    - As a new user:
        - Register a new user.
        - Check the email you registered.
            - **Confirm email arrives.**
            - **Confirm email contains the token in plain text.**
            - **Confirm it contains a link.**
        - Click the link in the email.
            - **Confirm user is confirmed.**
            - **Confirm TOS page loads.**

- [ ] As a user, I can confirm my email by copying and pasting the token into the form.
    - As a new user:
        - Register a new user.
        - Check the email you registered.
            - **Confirm email arrives.**
            - **Confirm it contains a token.**
        - Copy the token into the form and click "Confirm".
            - **Confirm the user is confirmed.**
            - **Confirm the TOS page loads.**

### Manual Regression

All of the email confirmation cases require access to an email inbox, so none
of them can be covered by the Integration suite.

#### Success cases

- [ ] As a user, I can request a new confirmation email from the email confirmation form.
    - As a new user:
        - Register a new user.
        - Click "Resend" on the email confirmation screen.
            - **Confirm a new confirmation email is recieved.**
        - Click the confirmation link in the new email.
            - **Confirm email verification success.**

- [ ] As a user, I can logout from the email confirmation form.
    - As a new user:
        - Register a new user.
        - Click "Logout" on the email confirmation screen.
            - **Confirm logged out.**

- [ ] As a user, I can confirm my email by following the link in the email when I am logged out.
    - As a new user:
        - Register a new user.
            - **Confirm email confirmnation recieved.**
        - Log out from the email confirmation screen.
        - Follow confirmation link in the confirmation email.
            - **Confirm email confirmation form shows success message.**
            - **Confirm redirected to login page.**

- [ ] As a user, I can confirm my email by copying and pasting the token from the email.
    - As a new user:
        - Register a new user.
            - **Confirm email confirmnation recieved.**
        - Copy the token from the confirmation email.
        - Paste the token into the text box on the email confirmation screen.
        - Click "Confirm".
            - **Confirm email confirmation form shows success message.**
            - **Confirm redirected to login page.**

#### Error cases

- [ ] As a user, I am shown an error when I follow a link with an invalid token.
    - As a new, unconfirmed user:
        - Follow a confirmation link with a corrupted token.
            - **Confirm an error is shown and the account stays unconfirmed.**

- [ ] As a user, I am shown an error when I manually enter an invalid token.
    - As a new, unconfirmed user:
        - Enter a token that does not match the one emailed and click "Confirm".
            - **Confirm an error is shown and the account stays unconfirmed.**

- [ ] As a user, I am shown an error when I request a new confirmation while already confirmed.
    - As a newly confirmed user:
        - Return to the email confirmation screen and click "Resend".
            - **Confirm an error is shown and no new email is sent.**

- [ ] As a user, I am simply forwarded to TOS when I attempt to re-confirm after already confirming.
    - As a newly confirmed user:
        - Follow the confirmation link a second time.
            - **Confirm no error is shown and the TOS page loads.**

### Full Regression

The email confirmation endpoints are not yet covered by the Integration suite.
All email confirmation cases are defined in the Smoke Test and Manual
Regression sections above.
