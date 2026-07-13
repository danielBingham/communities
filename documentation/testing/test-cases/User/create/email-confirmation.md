## [Create User: Email Confirmation](documentation/testing/test-cases/User/create/registration.md)

Cases covering the Email Confirmation flow. 

### Pre-requisites

No pre-requisites.

### Cases

#### Success cases

- [ ] As a user, I can confirm my email by following the link in the email.
    - Create a new user and confirm their email.
        - Register a new user.
        - Check the email you registered.
            - **Confirm email arrives.**
            - **Confirm email contains the token in plain text.**
            - **Confirm it contains a link.**
        - Click the link in the email.
            - **Confirm user is confirmed.**
            - **Confirm TOS page loads.**

- [ ] As a user, I can confirm my email by copying and pasting the token into the form.
    - Create a new user and confirm their email.
        - Register a new user.
        - Check the email you registered.
            - **Confirm email arrives.**
            - **Confirm it contains a token.**
        - Click copy the token into the form.  Click Confirm.
            - **Confirm the user is confirmed.**
            - **Confirm the TOS page loads.**

- [ ] As a user, I can request a new confirmation email from the email confirmation form.
    - Create a new user and request a new confirmation email.
        - Register a new user.
        - Click "Resend" on the email confirmation screen.
            - **Confirm a new confirmation email is recieved.**
        - Click the confirmation link in the new email.
            - **Confirm email verification success.**

- [ ] As a user, I can logout from the email confirmation form.
    - Create a new user and then log out from the confirmation screen.
        - Register a new user.
        - Click "Logout" on the email confirmation screen.
            - **Confirm logged out.**

- [ ] As a user, I can confirm my email by following the link in the email when I am logged out.
    - Create a new User, log out from the confirmation form, then confirm.
        - Register a new user.
            - **Confirm email confirmnation recieved.**
        - Log out from the email confirmation screen.
        - Follow confirmation link in the confirmation email.
            - **Confirm email confirmation form shows success message.**
            - **Confirm redirected to login page.**

- [ ] As a user, I can confirm my email by copying and pasting the token from the email.
    - Create a new User and confirm by copying and pasting the token.
        - Register a new user.
            - **Confirm email confirmnation recieved.**
        - Copy the token from the confirmation email.
        - Paste the token into the text box on the email confirmation screen.
        - Click "Confirm".
            - **Confirm email confirmation form shows success message.**
            - **Confirm redirected to login page.**

#### Error cases

- [ ] Users are shown an error when they follow a link with an invalid token.
- [ ] Users are shown an error when they manually enter an invalid token.
- [ ] Users are shown an error when they attempt to request a new confirmation while already confirmed.
- [ ] Users are simply forwarded to TOS when they attempt to re-confirm after already confirming.
