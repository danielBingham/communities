# Authentication

Logging in and out, lockout, resetting a password, and multi-factor
authentication. How sessions work underneath is in
[Sessions and CSRF](../server/sessions-and-csrf.md).

## Logging In

1. `/login` (or the form on `/`) sends `POST /authentication` with an email
   and password.
2. `AuthenticationService.authenticateUser()` checks them:
   - an unknown email and a wrong password fail the same way
     (`authentication-failed`), so the response never says whether an
     account exists;
   - banned users can't log in;
   - ten failures in fifteen minutes lock the account for fifteen minutes
     (`authentication-timeout`), counted on the user
     (`failed_authentication_attempts`, `last_authentication_attempt_date`).
3. **Without MFA**, the session is regenerated and the user is logged in.
4. **With MFA on**, the session gets `pendingUserId` instead of a user. The
   client's `AuthenticatedLayout` shows the multi-factor page, which sends
   `PATCH /authentication` with a code from the authenticator app
   (`token`) or a recovery code (`recoveryCode`). A correct one completes
   the login. Too many wrong codes in a short time are refused.

`GET /authentication` returns the current user (or the pending one), and
is how the client learns who's logged in when it starts.

## Logging Out

`DELETE /authentication` destroys the session. The client resets its
store, clears local storage (drafts) and, in the apps, the stored session
ID, and reloads at `/`.

## Resetting a Password

1. `/reset-password-request`: `POST /tokens` with `type: 'reset-password'`
   and the email. If an account exists, it gets a `reset-password` token by
   email; the response is the same either way.
2. The link opens `/reset-password`, which redeems the token
   (`PATCH /tokens`) and then sets the new password.
3. Changing the password ends all the user's sessions and sends them an
   alert email.

Changing a password while logged in (from `/account/security`) needs the
current password, ends their other sessions, and also sends the alert.

## Multi-Factor Authentication

Time-based one-time passwords (TOTP), from any authenticator app, through
`otplib`. Set up from `/account/security/setup-multifactor`, through
`PATCH /user/:id` with `authenticationMultifactorState`:

| State (`authentication__multifactor_state`) | How it's reached |
| ------------------------------------------- | ---------------- |
| `disabled` | The default; or turning it off. |
| `pending` | Starting setup: `MultifactorAuthenticationService.initialize()` makes a secret, stores it encrypted, and returns it once for the app to show as a QR code. |
| `enabled` | Confirming a code from the authenticator app: `verify()`, then `enable()`, which also generates ten recovery codes, shown once. |

- **Secrets** are encrypted with `EncryptionService` and the versioned key in
  `encryption.mfa` (`v1`), so the key can be rotated.
- **Recovery codes** are stored hashed with bcrypt in
  `user_recovery_codes`; each works once.
- Only the user can change their own MFA, and only when fully logged in.

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controllers | `web-application/server/controllers/AuthenticationController.js`, `TokenController.js`, `UserController.js` (password and MFA changes) |
| Services | `packages/backend/services/AuthenticationService.js`, `MultifactorAuthenticationService.js`, `EncryptionService.js`, `SessionService.js`, `TokenService.js` |
| Client | `web-application/client/state/authentication.js`, `pages/authentication/`, `components/authentication/`, `components/users/account/` |
| Tests | `web-application/test/integration/suites/AuthenticationController/`, `packages/backend/test/services/AuthenticationService.spec.js`, `EncryptionService.spec.js` |
| Manual cases | `documentation/testing/test-cases/Authentication/`, `documentation/testing/test-cases/User/update/mfa.md`, `security.md` |
