## [Update User: Security](documentation/testing/test-cases/User/update/security.md)

Cases covering the user updating their security fields.

### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered.

### Smoke Test

#### Change Email

- [ ] As a user, I can update my email and am required to confirm new email.
    - As User1:
        - Select "Change Email" from the User Menu.
        - Enter a new email and your current password.
        - Submit.
            - **Confirm you are limited to the "Confirm your email" screen.**
        - Open your email client (mailinator) to the new email.
            - **Confirm email is present.**
        - Click "Resend Confirmation".
            - **Confirm second email arrives.**
        - Click the confirmation link in the email.
            - **Confirm email is updated and access to the platform restored.**
        - Log out.
        - Log in using the new email.
            - **Confirm login successful.**

#### Change Password

- [ ] As a user, I can change my password.
    - As User1:
        - Select "Change Password" from the User Menu.
        - Enter a new password.
        - Enter a different password in the "Confirm Password" field.
            - **Confirm validation error.**
        - Enter the correct new password in the "Confirm Password" field.
        - Enter an incorrect old password in the "Old Password" field. Submit the form.
            - **Confirm submission fails.**
        - Enter the correct old password in the "Old Password" field. Submit the form.
            - **Confirm form submits successfully and reports success.**
        - Log out.
        - Attempt to log in using old password.
            - **Confirm login fails.**
        - Log in using the new password.
            - **Confirm log in is successful.**

- [ ] As a logged-in user, changing my password logs out my other sessions but keeps the current one.
    - As User1:
        - Log in on Browser A and, separately, on Browser B.
        - On Browser A, change the password from the Security settings.
            - **Confirm Browser A stays logged in.**
            - **Confirm a password change notification email is received.**
        - Return to Browser B and attempt to navigate or post.
            - **Confirm Browser B's session is no longer authenticated.**

### Manual Regression

#### Change Email

- [ ] As a user with MFA enabled, confirming a changed email while logged out does not bypass MFA.
    - As User1 (with MFA enabled):
        - While logged in, change the email address, then log out.
        - Follow the confirmation link sent to the new address while logged out.
            - **Confirm the email is confirmed but I am NOT logged in, and I am redirected to the login page.**
        - Log in with email and password.
            - **Confirm the MFA screen is shown and a valid TOPT token is required.**

- [ ] As a user, an email confirmation link can only be used once.
    - As a new user:
        - Register and receive the confirmation email.
        - Follow the confirmation link.
            - **Confirm confirmation succeeds.**
        - Follow the same confirmation link again.
            - **Confirm the link is now rejected with an invalid-token error.**

- [ ] As a user, an expired email confirmation link is rejected.
    - As a new user:
        - Register but do not confirm.
        - Wait longer than 1 day, then follow the confirmation link.
            - **Confirm the link is rejected with an invalid/expired-token error.**
        - Request a new confirmation email and follow the fresh link.
            - **Confirm the fresh link works.**

- [ ] As a user, I cannot use an email confirmation token that belongs to a different account.
    - As User1:
        - Change email to generate email confirmation link.
    - As User2:
        - Change email to generate email confirmation link.
    - As User1:
        - Attempt to use User2's confirmation link.
            - **Confirm error and User2 not confirmed.**
        - Confirm email with User1's confirmation link.
            - **Confirm success.**
        - Attempt to use User2's confirmation link.
            - **Confirm error and User2 not confirmed.**

#### Change Password

- [ ] As a user with MFA enabled, changing my password does not bypass MFA on my next login.
    - As User1:
        - Change the password while logged in.
        - Log out and log in with the new password.
            - **Confirm the MFA screen is shown and a valid TOPT token is required.**

### Full Regression

The email change and password change endpoints are not yet covered by the
Integration suite.  All security cases are defined in the Smoke Test and
Manual Regression sections above.
