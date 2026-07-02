# feat: multifactor authentication (#61)

Test cases for feature Multifactor Authentication, Issue #61.


## [Create User: Registration](documentation/testing/test-cases/User/create/registration.md)

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
        
## [Create User: Invitation](documentation/testing/test-cases/User/create/invitation.md)

Cases covering the User Invitation flow, in which a user is sent an invitation
email and may use it to register on the platform.

### Pre-requisites

- [ ] User1 has been registered and has made a private post.
- [ ] User2 has been registered and has made a public post.

### Cases

- [ ] As User1 invite James Smith (communities-james-smith@mailinator.com).
    - [ ] As User1, confirm invitation is visible on the "Friend Requests" page.
    - [ ] As James Smith, Accept the invite and register James Smith with username `james-smith`
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As James Smith, attempt to view User1's profile.  Confirm private post not visible.
    - [ ] As James Smith, accept the friend request and view User1's profile page.

- [ ] As User2, invite Jenny Smith (communities-jenny-smith@mailiantor.com).
    - [ ] As User2, confirm invitation is visible on the "Friend Requests" page.
    - [ ] As Jenny Smith, from the same browser session attempt to accept the invite.
        - [ ] Expectation: Error.
    - [ ] As User1, confirm the invitation is *not* visible on the "Friend Requests" page.
    - [ ] From a different browser session accept the invite and register Jenny Smith with username `jenny-smith`.
    - [ ] Successfully register.
        - [ ] Confirm email.
        - [ ] Accept Terms of Service.
        - [ ] Skip Pay What you Can.
    - [ ] Turn off all email notifications.
    - [ ] As Jenny Smith, accept the friend request and view User1's profile page.
 
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


## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

### Pre-requisites

- [ ] User1 has been registered.

### Cases


#### Log in

- [ ] As a user, I can log in through the splash page.
    - As unauthenticated user:
        - Go to the root `/` page.
        - Enter User1's email and password into the login form.
            - **Confirm authentication by navigating, posting, viewing some posts.**
        - Log out.

- [ ] As a user, I can log in through the Login page.
    - As unauthenticated user:
        - Go to the `/login` page.
        - Enter User1's email and password.
            - **Confirm authentication by navigating, posting, viewing some posts.**
        - Log out.

- [ ] As a user, I can log out.
    - As User1:
        - Make a draft post, but don't post it.
        - Select UserMenu -> Logout
            - **Confirm that you are logged out and no longer authenticated.**
        - Log in.
            - **Confirm draft post has been cleared.**

- [ ] As a user, I get temporarily locked out after too many attempts.
    - As User1: 
        - Attempt to login with the wrong pasword 10 times.
        - Confirm locked out.
        - Wait 15 minutes.
        - Login with correct password.
        - Confirm logged in.

- [ ] As a user, I can only log in with the correct password.
    - As unauthenticated user:
        - Attempt to log in with User1's email and incorrect password.
            - **Confirm login fails.**

- [ ] As a user, log in doesn't reveal whether an account with that email exists.
    - As unauthenticated user:
        - Attempt to log in with an email not associated to an account.
        - Attempt to log in with User1's email and incorrect password.
            - **Confirm both failures give same message.**

- [ ] As a user, actions in a stale tab are rejected after I have logged out and back in.
    - As User1:
        - Log in and open the app in two tabs (Tab A and Tab B).
        - In Tab A, log out and then log back in.
        - In Tab B (still showing the old session), attempt a state-changing action (e.g. post or edit profile).
            - **Confirm the action is rejected rather than silently succeeding.**

#### Reset Password

- [ ] As a user, I can request a password reset.
    - As User1:
        - Log out and click "Forgot password?"
        - Enter User1's email.
            - **Confirm reset email arrives.**
        - Click reset link.
            - **Confirm presented with Reset Password form.**
        - Enter a new password.
            - **Confirm success message shows and redirect to login form.**
            - **Confirm email notification of password change received.**
        - Log in with new password.
            - **Confirm success.**

- [ ] As a user who just reset password, I shouldn't be able to log in with my old password.
    - As User1:
        - Log out.
        - Attempt to log in with old password.
            - **Confirm failure.**
        - Attempt to log in with the new password.
            - **Confirm success.**

- [ ] As a user with MFA enabled, resetting my password should still require TOPT token to login.
    - As User1:
        - Log out.
        - Click "Forgot password?"
        - Enter User1's email.
            - **Confirm reset email received.**
        - Follow link in reset email.
        - Enter new password.
            - **Confirm success message and redirect to log in form.**
        - Log in with email and new password.
            - **Confirm MFA screen shown.**
        - Enter invalid TOPT token.
            - **Confirm error.**
        - Enter valid TOPT token.
            - **Confirm log in success.**

- [ ] As a user, a password reset link can only be used once.
    - As User1:
        - Log out and click "Forgot password?"
        - Enter User1's email and follow the link in the reset email.
        - Enter a new password and submit.
            - **Confirm success and redirect to login.**
        - Navigate back to the same reset link (browser back or paste the URL again).
            - **Confirm the link is now rejected with an invalid-token error.**

- [ ] As a user, an expired password reset link is rejected.
    - As User1:
        - Log out and click "Forgot password?"
        - Enter User1's email but do not open the link yet.
        - Wait longer than 30 minutes, then follow the link in the reset email.
            - **Confirm the link is rejected with an invalid/expired-token error.**
        - Request a new reset and confirm a fresh link works.


- [ ] As a user, requesting a reset for an unknown email doesn't reveal whether an account exists.
    - As unauthenticated user:
        - Click "Forgot password?" and enter an email not associated with any account.
            - **Confirm the same success/confirmation message is shown as for a known email.**
            - **Confirm no reset email is received at that address.**

- [ ] As a user, resetting my password logs out all of my other sessions.
    - As User1:
        - Log in on Browser A and, separately, on Browser B.
        - On Browser A, log out and complete the "Forgot password?" reset flow with a new password.
        - Return to Browser B and attempt to navigate or post.
            - **Confirm Browser B's session is no longer authenticated.**

- [ ] As a user, I am not automatically logged in after resetting my password.
    - As User1:
        - Complete the "Forgot password?" reset flow with a new password.
            - **Confirm I land on the login page and am not authenticated.**
        - Log in with the new password.
            - **Confirm success.**

- [ ] As a user, the reset password form validates the new password.
    - As User1:
        - Log out.
        - Open a valid reset link.
        - Enter a new password shorter than 12 characters. Submit.
            - **Confirm a validation error.**
        - Enter a new password longer than 256 characters. Submit.
            - **Confirm a validation error.**
        - Enter a new password but a non-matching confirmation. Submit.
            - **Confirm a confirmation-mismatch error.**
        - Enter a valid, matching password. Submit.
            - **Confirm success.**


### Multifactor Authentication

- [ ] As a user with MFA enabled, I should be required to enter a TOPT token when logging in.
    - As User1:
        - Log out.
        - Log in with username and password.
            - **Confirm presented with MFA screen.**
        - Enter current MFA token.
            - **Confirm log in success.**

- [ ] As a user with MFA enabled, I should be able to use one of my recovery codes in place of a TOPT token.
    - As User1:
        - Log out.
        - Log in with username and password.
            - **Confirm presented with an MFA screen.**
        - Switch to recovery code view.
        - Enter an invalid recovery code.
            - **Confirm error.**
        - Enter recovery code.
            - **Confirm log in success.**
            - **Confirm email notification of recovery code usage recieved.**

- [ ] As a user with MFA enabled, I should be rate limited when I enter too many invalid TOPT tokens.
    - As User1:
        - Log out.
        - Log in with email and password.
        - Enter an invalid TOPT token 10 times.
            - **Confirm rate limiting message shows with each additional attempt.**
        - Wait 30 seconds.
        - Enter an invalid TOPT token.
            - **Confirm non-rate limit error shows.**
        - Enter a valid TOPT token.
            - **Confirm login success.**

- [ ] As a user with MFA enabled, I should only be able to use each recovery code once.
    - As User1:
        - Log out.
        - Log in with email and password.
            - **Confirm presented with MFA screen.**
        - Switch to recovery code screen.
        - Enter valid recovery code.
            - **Confirm successful login.**
        - Log out.
        - Log in with email and password.
            - **Confirm presented with MFA screen.**
        - Switch to recovery code screen.
        - Enter same recovery code as just used.
            - **Confirm error.**

- [ ] As a user with MFA enabled, I should be rate limited when I enter too many invalid recovery codes.
    - As User1:
        - Log out.
        - Log in with email and password.
        - Switch to recovery code screen.
        - Enter an invalid recovery code 10 times.
            - **Confirm rate limiting message shows with each additional attempt.**
        - Wait 30 seconds.
        - Enter an invalid recovery code.
            - **Confirm non-rate limit error shows.**
        - Enter a valid recovery code.
            - **Confirm success.**

- [ ] As a user with MFA enabled, I should be able to disable MFA.
    - As User1:
        - From the UserMenu select "Multifactor Authentication".
        - Click "Disabled Multifactor Authentication".
            - **Confirm email notification of MFA change recieved.**

- [ ] As a user who has entered my password but not my MFA token, I cannot access authenticated content.
    - As User1:
        - Log out, then log in with email and password so the MFA screen is shown.
        - Without entering a token, attempt to navigate directly to an authenticated page (e.g. the home feed or a group URL).
            - **Confirm authenticated content is not shown and I remain on the MFA screen.**
        - Attempt an authenticated action (e.g. loading my feed) via the app.
            - **Confirm the action is not permitted while MFA is pending.**

- [ ] As a user at the MFA screen, I can cancel and return to an unauthenticated state.
    - As User1:
        - Log out, then log in with email and password so the MFA screen is shown.
        - Click "Cancel".
            - **Confirm I am returned to an unauthenticated state and am not logged in.**
        - Attempt to navigate to an authenticated page.
            - **Confirm authenticated content is not shown.**

- [ ] As a user, a valid TOPT token succeeds after a few failed attempts and clears the counter.
    - As User1:
        - Log out and log in with email and password.
        - Enter an invalid TOPT token a few times (fewer than 10).
        - Enter a valid TOPT token.
            - **Confirm login succeeds.**
        - Log out and log in again, entering a valid token on the first try.
            - **Confirm login succeeds (the earlier failures did not carry over).**

- [ ] As a user, an out-of-date TOPT token is rejected.
    - As User1:
        - Log out and log in with email and password.
        - Note the current code in the authenticator app, then wait for it to roll over to a new code.
        - Enter the previous (now expired) code.
            - **Confirm it is rejected.**
        - Enter the current code.
            - **Confirm login succeeds.**

- [ ] As a user, the MFA token field rejects malformed input.
    - As User1:
        - Log out and log in with email and password to reach the MFA screen.
        - Submit with the token field empty.
            - **Confirm a validation error.**
        - Enter fewer than 6 digits and submit.
            - **Confirm a validation error.**
        - Enter more than 6 characters and submit.
            - **Confirm a validation error.**

- [ ] As a user, the recovery code field rejects malformed input.
    - As User1:
        - Log out and log in with email and password, then switch to the recovery code view.
        - Submit with the recovery code field empty.
            - **Confirm a validation error.**
        - Enter a recovery code of the wrong length and submit.
            - **Confirm a validation error.**

- [ ] As a user, switching between the TOPT and recovery code views keeps my pending login.
    - As User1:
        - Log out and log in with email and password to reach the MFA screen.
        - Switch to the recovery code view and back to the TOPT view.
        - Enter a valid TOPT token.
            - **Confirm login succeeds (I was not forced to re-enter my password).**

- [ ] As a user, invalid TOPT tokens and invalid recovery codes count toward the same rate limit.
    - As User1:
        - Log out and log in with email and password.
        - Enter a mix of invalid TOPT tokens and invalid recovery codes totaling 10 attempts.
            - **Confirm rate limiting engages.**
        - Wait 30 seconds and enter a valid token or recovery code.
            - **Confirm login succeeds.**

## [Update User: Security](documentation/testing/test-cases/User/update/profile.md)

Cases covering the user updating their security fields.

### Pre-requisites

- [ ] User1 has registered.
- [ ] User2 has registered.

### Cases


### Change Email

- [ ] As a user, I can update my email and am required to confirm new email.
    - As User1:
        - Select "Change Email" from the User Menu.
        - Enter a new email and your current password.
        - Submit. 
            - **Confirm you are limited to the "Confirm your email" screen.**
        - Open your email client (mailinator) to the new email. 
            - **Confirm email is present.**
        - Click "Resend Confirmation".
        - In your email client, confirm second email arrives.
        - Click the confirmation link in the email.
            - **Confirm email is updated and access to the platform restored.**
        - Log out.
        - Log in using the new email.
            - **Confirm login successful.**

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
        - Request a new confirmation email and confirm the fresh link works.

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

### Change Password

- [ ] User can change password.
    - As User1:
        - Select "Change Password" from the User Menu.
        - Enter a new password. 
        - Enter a different password in the "Confirm Password" field.  Confirm validation error.
        - Enter the correct new password in the "Confirm Password" field.
        - Enter an incorrect old password in the "Old Password" field.
        - Submit the form.  Confirm submission fails.
        - Enter the correct old password in the "Old Password" field.
        - Submit the form. Confirm form submits successful and reports success.
        - Log out.
        - Attempt to log in using old password.  Confirm login fails.
        - Log in using the new password.  Confirm log in is successful.

- [ ] As a logged-in user, changing my password logs out my other sessions but keeps the current one.
    - As User1:
        - Log in on Browser A and, separately, on Browser B.
        - On Browser A, change the password from the Security settings.
            - **Confirm Browser A stays logged in.**
            - **Confirm a password change notification email is received.**
        - Return to Browser B and attempt to navigate or post.
            - **Confirm Browser B's session is no longer authenticated.**

- [ ] As a user with MFA enabled, changing my password does not bypass MFA on my next login.
    - As User1:
        - Change the password while logged in.
        - Log out and log in with the new password.
            - **Confirm the MFA screen is shown and a valid TOPT token is required.**

## [Update User: MFA](documentation/testing/test-cases/User/update/mfa.md)

Cases cover Multifactor Authentication (MFA) setup.

### Pre-requisites

- [ ] User1 has been registered.

### Cases

- [ ] As a user, I can enable multifactor authentication.
    - As User1:
        - Select "Multifactor Authentication" from the UserMenu.
        - Click "Setup Multifactor Authentication"
        - Use an authentication app to follow the QR code.
            - **Confirm app loads an authentication site with correct values for Site (Communities) and email (User1's email).**
        - Enter an invalid 6 digit code.
            - **Confirm error.**
        - Enter the 6 digit code from the authentication app to confirm setup.
            - **Confirm setup confirmed and recovery codes presented.**
            - **Confirm email notifying of MFA change.**
        - Save the backup codes somewhere accessible.


- [ ] As a user, I can set up MFA by manually entering the secret instead of scanning the QR code.
    - As User1:
        - Start MFA setup from the Security settings.
        - Copy the displayed secret (or use the copy button) and enter it manually into an authenticator app.
            - **Confirm the app generates codes for Communities with User1's email.**
        - Enter a valid code to confirm setup.
            - **Confirm setup succeeds and recovery codes are presented.**

- [ ] As a user, I can cancel MFA setup before confirming and remain without MFA.
    - As User1:
        - Start MFA setup and reach the QR/secret screen.
        - Click "Cancel Setup".
            - **Confirm MFA is left disabled.**
        - Log out and log back in.
            - **Confirm no MFA screen is shown.**

- [ ] As a user, if I refresh the page mid-setup I can safely restart setup.
    - As User1:
        - Start MFA setup and reach the QR/secret screen.
        - Refresh the browser.
            - **Confirm setup has reset (no stale secret) and MFA is disabled.**
        - Start setup again.
            - **Confirm a new QR/secret is generated and setup can be completed.**

- [ ] As a user, my MFA secret is only shown once, during setup.
    - As User1:
        - Complete MFA setup.
        - Navigate away and return to the MFA settings screen.
            - **Confirm the secret and QR code are not shown again.**
            - **Confirm only the enabled state and a disable option are shown.**

- [ ] As a user, my recovery codes are only shown once, during setup.
    - As User1:
        - Complete MFA setup so recovery codes are displayed.
        - Click "Complete Setup".
        - Navigate away and return to the MFA settings screen.
            - **Confirm the recovery codes are not shown again.**

- [ ] As a user, my recovery codes are not shown again if I refresh the recovery-codes screen.
    - As User1:
        - Complete MFA setup so recovery codes are displayed.
        - Refresh the browser while the codes are shown.
            - **Confirm the codes are not shown again and I am not left mid-setup.**

- [ ] As a user, my MFA secret and recovery codes do not leak in application responses after setup.
    - As User1:
        - With browser developer tools open (Network tab), complete MFA setup and continue using the app.
            - **Confirm the secret only appears in the response to the setup (pending) request.**
            - **Confirm the recovery codes only appear in the response that confirms setup.**
        - Reload the app and inspect the authenticated user object and subsequent responses.
            - **Confirm neither the secret nor the recovery codes appear in any later response.**

- [ ] As a user, disabling and re-enabling MFA invalidates my old authenticator entry and old recovery codes.
    - As User1:
        - With MFA enabled, disable MFA.
        - Re-enable MFA and complete setup with a newly scanned secret.
        - Log out and attempt to log in using a code from the *old* authenticator entry.
            - **Confirm the old code is rejected.**
        - Attempt to log in using one of the *old* recovery codes.
            - **Confirm the old recovery code is rejected.**
        - Log in using the new authenticator entry.
            - **Confirm success.**

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
