# Registration and Onboarding

How people get an account: registering or accepting an invitation,
confirming their email, and the gates every new user passes through.

## Registering

1. `/register`: name, email, password, birthdate and username.
2. `POST /users` (with no current user) runs `UserService.registerUser()`:
   - refuses anyone under 18 (430 `underage`);
   - refuses an email whose domain is on the blocklist;
   - creates the user as `unconfirmed`, and an `email-confirmation` token;
   - emails the confirmation link.
3. The new session is regenerated and logged in, so the user goes straight
   to `/email-confirmation` to wait for the link.

## Invitations

Logged-in users invite people from `/friends/invite`, which also calls
`POST /users`, with a current user:

- `UserService.inviteUser()` creates the invited person as an `invited`
  user (or finds them, if they already exist), creates an `invitation`
  token, and emails it. The invitation also creates a friend request from
  the inviter.
- The blocklist only applies to new invitations.
- The invited person follows the link to `/accept-invitation`, which logs
  them in with the token, and sets their name, username and password.

## Tokens

`tokens` holds single-use tokens, each with a `type`:

| Type | Created by | Redeemed at | Redeeming it |
| ---- | ---------- | ----------- | ------------ |
| `email-confirmation` | Registration, an email change, or asking for the email again (`POST /tokens`) | `/email-confirmation` → `PATCH /tokens` | Marks the user `confirmed` and logs them in. |
| `reset-password` | `/reset-password-request` → `POST /tokens` | `/reset-password` → `PATCH /tokens` | Lets them set a new password (in a following step), which ends all their sessions. |
| `invitation` | An invitation | `/accept-invitation` → `PATCH /tokens` | Logs them in to finish their account. |

Asking for a password reset answers the same way whether or not the email
has an account.

## The Gates

Once logged in, `useAuthentication()` in the client sends the user to
anything they haven't finished, in this order:

| Gate | When | Page |
| ---- | ---- | ---- |
| Age gate | Their stored birthdate is under 18. | `/age-gate` (they're logged out). |
| Invitation | `status` is `invited`. | `/accept-invitation` |
| Email confirmation | `status` is `unconfirmed`. | `/email-confirmation` |
| Terms of Service | `notices.termsOfService` isn't set. | `/accept-terms-of-service` |

Then, inside the app:

- **The welcome notice** shows over any page until it's dismissed
  (`notices.welcomeNotice`). Users who saw the older contribution notice
  don't see it.
- **Contribution:** the platform is funded by its members. The welcome flow
  and `/set-contribution` link to Stripe donation pages for the amount
  chosen (`stripe.links` in the configuration, sent to the client on
  initialization).

Notices are set with `PATCH /user/:id`. The API doesn't enforce them; only
the client does.

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controllers | `web-application/server/controllers/UserController.js` (`postUsers`), `TokenController.js` |
| Services | `packages/backend/services/UserService.js`, `TokenService.js`, `EmailService.js` |
| Data | `packages/backend/daos/UserDAO.js`, `TokenDAO.js`, `BlocklistDAO.js` |
| Client | `web-application/client/pages/authentication/`, `components/authentication/`, `components/notices/`, `lib/hooks/useAuthentication.js` |
| Manual cases | `documentation/testing/test-cases/User/create/` |
