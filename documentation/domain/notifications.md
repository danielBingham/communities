# Notifications

How users are told about activity: notification types, how one is created
and delivered by web, email and push, and the settings that control them.

## The Flow

```
Controller ──► NotificationService.sendNotifications(currentUser, 'PostComment:create', context)
                      │  (a send-notifications job)
                      ▼
Worker ──► NotificationWorker.processNotification()
                      │
                      ▼
           PostCommentNotifications.create()      works out who to notify:
                      │                           author, subscribers, mentions
                      ▼                           (checking each can still see it)
           createNotification(userId, 'PostComment:create:author', context)
                      │
          ┌───────────┼──────────────────────┐
          ▼           ▼                      ▼
        web         email                  push
   (notifications  (EmailService,     (each push driver:
    table + event)  the definition's   APNs, FCM)
                    email template)
```

1. **A controller** calls `NotificationService.sendNotifications()` with an
   event type (`PostComment:create`) and the context it has (the post, the
   comment, its author). That adds a `send-notifications` job, tried once:
   no notification is better than duplicates.
2. **The worker's `NotificationWorker`** passes it to the entity's
   notifications class (`services/notification/entities/`), which works out
   who should hear about it and checks each can still see the content.
3. **For each recipient**, it creates a notification of a full type
   (`PostComment:create:author`), using that type's **definition**.
4. **The definition** (`services/notification/definitions/<Entity>/<action>/<audience>.js`)
   has Handlebars templates for the web text and link, and the email
   subject and body (`<audience>.hbs`, inside `definitions/layout.hbs`).

## Delivery and Settings

Each user's `settings.notifications[type]` has four switches, all on by
default:

| Setting | Effect |
| ------- | ------ |
| `web` | The notification is saved unread in `notifications` and sent to their open clients as a `Notification:create` event. Off: saved already read, and not sent. |
| `email` | Emailed through `EmailService`, with the definition's subject and body. |
| `mobile` | Pushed to their phones through each push driver. |
| `desktop` | Browser notifications, in the client. |

Users change them at `/account/notifications`. Invited users who haven't
joined get no email or push. Settings for types that were renamed fall back
to the old type's setting (`notificationMigrationMap`).

## The Types

| Entity | Types |
| ------ | ----- |
| Post | `Post:create:mention`, `Post:create:type:group:subscriber` |
| PostComment | `PostComment:create:author`, `:subscriber`, `:mention` |
| UserRelationship | `UserRelationship:create:relation` (a friend request), `UserRelationship:update:user` (accepted) |
| Group | `Group:update:title:changed:member` |
| GroupMember | Invitations, requests, accepted requests, and promotions to moderator and admin |
| GroupModeration | Flags for moderators; approvals and rejections for authors |
| SiteModeration | Rejections for authors |

The full list is the definition files under
`packages/backend/services/notification/definitions/`.

## In the Client

- The notification menu lists them (`GET /notifications`), subscribes to
  `Notification:create` to show new ones as they arrive, and marks them read
  (`PATCH /notification/:id`, or all at once with `PATCH /notifications`).
- The apps register for push notifications and keep the app's badge count
  in step. See [Native Features](../mobile/native-features.md).

## Adding a Type

See [Add a Notification](../how-to/add-a-notification.md).

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Queuing | `packages/backend/services/NotificationService.js` |
| Creating and delivering | `packages/backend/services/notification/NotificationWorker.js`, `entities/`, `definitions/` |
| Worker | `worker/jobs/sendNotifications.js` |
| Events | `packages/backend/events/NotificationEvents.js` |
| Email and push | `packages/backend/services/EmailService.js`, `packages/backend/services/push/` |
| Controller | `web-application/server/controllers/NotificationController.js` |
| Data | `packages/backend/daos/NotificationDAO.js`, the `notifications` table |
| Client | `web-application/client/state/notifications.js`, `components/notifications/`, `pages/users/views/UserAccountNotificationsView.js`, `lib/hooks/useNotifications.js` |
| Tests | `packages/backend/test/services/notification/` |
