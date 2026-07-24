## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been registered.
- [ ] User1 has Multifactor Authentication enabled, with an authenticator app
      enrolled and their recovery codes saved.
- [ ] An email client (mailinator) is available for User1's address.

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

- [ ] As a user, I can log out. (covered: integration)
    - As User1:
        - Make a draft post, but don't post it.
        - Select UserMenu -> Logout
            - **Confirm that you are logged out and no longer authenticated.**
        - Log in.
            - **Confirm draft post has been cleared.**

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

- [ ] As a user, requesting a reset for an unknown email doesn't reveal whether an account exists.
    - As unauthenticated user:
        - Click "Forgot password?" and enter an email not associated with any account.
            - **Confirm the same success/confirmation message is shown as for a known email.**
            - **Confirm no reset email is received at that address.**

#### Multifactor Authentication

- [ ] As a user with MFA enabled, I should be required to enter a TOPT token when logging in. (covered: integration)
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

- [ ] As a user who has entered my password but not my MFA token, I cannot access authenticated content. (covered: integration)
    - As User1:
        - Log out, then log in with email and password so the MFA screen is shown.
        - Without entering a token, attempt to navigate directly to an authenticated page (e.g. the home feed or a group URL).
            - **Confirm authenticated content is not shown and I remain on the MFA screen.**
        - Attempt an authenticated action (e.g. loading my feed) via the app.
            - **Confirm the action is not permitted while MFA is pending.**

### Manual Regression

#### Pre-requisites

- [ ] User1 has been registered.
- [ ] User1 has Multifactor Authentication enabled, with an authenticator app
      enrolled and their recovery codes saved.
- [ ] An email client (mailinator) is available for User1's address.
- [ ] A second browser or profile (Browser B) is available for the
      multi-session cases.

#### Reset Password

All of the reset password cases require access to an email inbox, so none of
them can be covered by the Integration suite.

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
        - Request a new reset.
            - **Confirm a fresh link works.**

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

#### Multifactor Authentication

All of the MFA cases below require an MFA device (or a generated TOPT secret)
and so cannot be covered by the Integration suite.

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

### Full Regression

#### Pre-requisites

- [ ] User1 has been registered.
- [ ] User1 has Multifactor Authentication enabled, with an authenticator app enrolled.
- [ ] User2 has been registered and has been banned by a site moderator.

#### Log in

- [ ] As a user, I get temporarily locked out after too many attempts. (covered: integration)
    - As User1:
        - Attempt to login with the wrong pasword 10 times.
            - **Confirm locked out.**
        - Wait 15 minutes.
        - Login with correct password.
            - **Confirm logged in.**

- [ ] As a user, I can only log in with the correct password. (covered: integration)
    - As unauthenticated user:
        - Attempt to log in with User1's email and incorrect password.
            - **Confirm login fails.**

- [ ] As a user, log in doesn't reveal whether an account with that email exists. (covered: integration)
    - As unauthenticated user:
        - Attempt to log in with an email not associated to an account.
        - Attempt to log in with User1's email and incorrect password.
            - **Confirm both failures give same message.**

- [ ] As a user, my email is normalized before I am authenticated. (covered: integration)
    - As unauthenticated user:
        - Log in using User1's email with different capitalisation and surrounding whitespace.
            - **Confirm login succeeds.**

- [ ] As a user, I must supply a password when I supply an email. (covered: integration)
    - As unauthenticated user:
        - Submit the login form with User1's email and no password at all.
            - **Confirm login is rejected.**
        - Submit with User1's email and an empty password.
            - **Confirm login is rejected.**
        - Submit with User1's email and a password of only whitespace.
            - **Confirm login is rejected.**

- [ ] As a user, an authentication attempt with neither an email nor a token is rejected. (covered: integration)
    - As unauthenticated user:
        - Submit an authentication request carrying neither an email nor a token.
            - **Confirm the request is rejected.**

- [ ] As a banned user, I cannot log in. (covered: integration)
    - As User2 (banned):
        - Attempt to log in with the correct email and password.
            - **Confirm login is refused.**

#### Session

- [ ] As a user, my session reports who I am. (covered: integration)
    - As User1:
        - Log in and load the app.
            - **Confirm the session identifies User1 and exposes the full user record.**
            - **Confirm the session never contains a password or multifactor secret.**

- [ ] As an unauthenticated visitor, my session is empty. (covered: integration)
    - As unauthenticated user:
        - Load the app without logging in.
            - **Confirm the session is null.**
        - Load the app with no session credentials at all (a fresh private window).
            - **Confirm the session is null.**

- [ ] As a user, my session is emptied when I log out. (covered: integration)
    - As User1:
        - Log in, then log out.
            - **Confirm the session is null after logging out.**
            - **Confirm the previous session token is no longer accepted.**

- [ ] As a user mid-MFA-login, my session is reported as pending. (covered: integration)
    - As User1 (with MFA enabled):
        - Log in with email and password but do not enter a token.
            - **Confirm the session is reported as pending rather than authenticated.**

- [ ] As a user, logging out succeeds even when I was never logged in. (covered: integration)
    - As unauthenticated user:
        - Trigger a log out without having logged in.
            - **Confirm the request succeeds rather than erroring.**

#### Multifactor Authentication

- [ ] As a user, MFA verification is refused when I have not logged in. (covered: integration)
    - As unauthenticated user:
        - Submit an MFA verification without having entered an email and password first.
            - **Confirm the request is rejected.**

- [ ] As a user, MFA verification is refused when I omit the token. (covered: integration)
    - As User1 (with MFA enabled):
        - Log in with email and password to reach the MFA screen.
        - Submit the verification with no token supplied.
            - **Confirm the request is rejected.**

- [ ] As a user who is not mid-MFA-setup, verification is refused. (covered: integration)
    - As User1 (fully logged in, not setting up MFA):
        - Submit an MFA setup verification.
            - **Confirm the request is rejected.**
