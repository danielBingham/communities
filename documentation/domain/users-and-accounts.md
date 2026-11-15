# Users and Accounts

The User: what an account holds, its statuses and roles, and what users can
change about their own accounts. Signing up is in
[Registration and Onboarding](registration-and-onboarding.md); logging in
is in [Authentication](authentication.md).

## What an Account Holds

| Part | Columns (`users`) | Notes |
| ---- | ----------------- | ----- |
| Identity | `name`, `username`, `email` | `username` is unique and is the profile's URL (`/<username>`). `email` is only selected when asked for (`SELECT.REQUEST`). |
| Credentials | `password`, `authentication__multifactor_*` | Never selected (`SELECT.NEVER`). See [Authentication](authentication.md). |
| Status | `status` | See below. |
| Role | `site_role` | `user`, `moderator`, `admin` or `superadmin`. |
| Profile | `about`, `file_id` (profile picture), `location` | |
| Privacy | `privacy__view_friends`, `privacy__view_mutual_friends` | Who can see their friends list and mutual friends: `me`, `friends`, `friends-of-friends` or `public`. |
| Settings | `settings` (JSON) | Notification settings per type (`settings.notifications`), and feed preferences (`showAnnouncements`, `showInfo`). |
| Notices | `notices` (JSON) | Which one-time notices they've seen or accepted: `termsOfService`, `welcomeNotice`. |
| Birthdate | `birthdate` | Kept only until the age check passes, then cleared. |

## Statuses

| Status | Means | Can |
| ------ | ----- | --- |
| `invited` | Someone invited them; they haven't registered. | Nothing until they accept. Gets no notification emails. |
| `unconfirmed` | Registered, or changed their email, and hasn't confirmed it. | Log in, but is sent to `/email-confirmation`. `PermissionService` refuses everything else. |
| `confirmed` | A full account. | Everything their role allows. |
| `banned` | Banned by a moderator. | Nothing: their sessions are deleted, and `PermissionService` refuses everything. Hidden from other users. |

## Site Roles

| Role | Adds |
| ---- | ---- |
| `user` | |
| `moderator` | Moderating the site: the moderation queue, viewing anything, banning. (`can(user, 'moderate', 'Site')`) |
| `admin` | Administering the site: announcements and info posts, News, feature flags, the blocklist. (`can(user, 'admin', 'Site')`) |
| `superadmin` | `sudo` actions. (`can(user, 'sudo', 'Site')`) |

Roles are set in the database or by administrators; see
[Your First Account](../getting-started/your-first-account.md) and
[Administration](administration.md).

## Account Settings

The account pages (`/account/...`) let users change, through
`PATCH /user/:id`:

| Page | Changes |
| ---- | ------- |
| Profile | Name, username, about, profile picture (uploaded and cropped as a File). |
| Security | Email (which makes them `unconfirmed` and sends a confirmation), password (with the current one; sends an alert email and ends their other sessions), and MFA. |
| Preferences | Feed settings. |
| Privacy | Who sees their friends and mutual friends. |
| Notifications | For each notification type, web, email and push on or off. See [Notifications](notifications.md). |
| Contribute | Their contribution, through Stripe. |
| Danger zone | Deleting their account (`DELETE /user/:id`), which ends their sessions. Banned users can't delete themselves. |

## Finding Users

`GET /users` searches users by name and username (trigram indexes), and
lists friends and mutual friends. Moderators can also search by email.
Invited and banned users are left out for everyone but moderators.

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controller | `web-application/server/controllers/UserController.js` |
| Data | `packages/backend/daos/UserDAO.js`, the `users` table |
| Services | `packages/backend/services/UserService.js`, `SessionService.js`, `EmailService.js` |
| Validation | `packages/shared/validation/entities/User.js`, `ValidationService.validateUser()` |
| Permissions | `packages/backend/services/permission/UserPermissions.js` |
| Client | `web-application/client/state/User/`, `lib/hooks/User/`, `components/users/`, `pages/users/` |
| Tests | `web-application/test/integration/suites/UserController/` |
| Manual cases | `documentation/testing/test-cases/User/` |
