## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

### Pre-requisites

- [ ] User1 has been created.
- [ ] User2 has been created.
- [ ] User3 has been created.

### Cases

- [ ] As User1, log out.
- [ ] As User1, attempt to log in with the wrong password. Confirm login fails.
- [ ] As User1, log in with the right password.  Confirm login succeeds.

- [ ] As User2, attempt to login with the wrong password.  Confirm login fails.
- [ ] As User2, attempt to login with the right password. Confirm login succeeds.

#### Reset Password

- [ ] As User2, log out and request a password reset. Change User2's password.
- [ ] As User2, log out and attempt to login with old password.  Confirm login fails.
- [ ] As User2, attempt to login with new password.  Confirm login succeeds.

#### Authentication Lockout 

- [ ] As User3, attempt to log in with the wrong password 10 times.
    - [ ] Confirm authentication timeout.
    - [ ] Wait 15 minutes.
    - [ ] Attempt to log in with the wrong password once.  Confirm login fails.
    - [ ] Attempt to log in with the correct password.  Confirm log in succeeds.
