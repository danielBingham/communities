## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

### Pre-requisites

- [ ] User1 has been registered.

### Cases


#### Log in: Success cases

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


#### Log in: Error Cases

- [ ] As a user, I can only log in with the correct password.
    - As unauthenticated user:
        - Attempt to log in with User1's email and incorrect password.
            - **Confirm login fails.**

- [ ] As a user, log in doesn't reveal whether an account with that email exists.
    - As unauthenticated user:
        - Attempt to log in with an email not associated to an account.
        - Attempt to log in with User1's email and incorrect password.
            - **Confirm both failures give same message.**

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


#### Authentication Lockout 

- [ ] As a user, I get temporarily locked out after too many attempts.
    - As User1: 
        - Attempt to login with the wrong pasword 10 times.
        - Confirm locked out.
        - Wait 15 minutes.
        - Login with correct password.
        - Confirm logged in.

### Multifactor Authentication

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
