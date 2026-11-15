# Add a Notification

How to notify users of something new: a definition with its templates, the
logic that decides who gets it, the trigger, and the setting that controls
it. How notifications work is in [Notifications](../domain/notifications.md).

## 1. Name the Type

`<Entity>:<action>:...:<audience>`, after the entity and action that cause
it and who receives it: `PostComment:create:subscriber`,
`GroupMember:update:role:moderator:member`. The controller sends the event
part (`PostComment:create`); the entity's notification class turns it into
one type per audience.

## 2. Write the Definition

Create `packages/backend/services/notification/definitions/<Entity>/<action>/.../<audience>.js`
(its path is its type), and the email body beside it as `<audience>.hbs`:

```javascript
const Handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')

const emailBodyTemplate = fs.readFileSync(path.resolve(__dirname, './author.hbs'), 'utf8')

module.exports = {
    type: 'PostComment:create:author',
    email: {
        subject: Handlebars.compile('[Communities] {{{commentAuthor.name}}} commented on your post "{{{postIntro}}}"'),
        body: Handlebars.compile(emailBodyTemplate)
    },
    web: {
        text: Handlebars.compile(`{{{commentAuthor.name}}} commented, "{{{commentIntro}}}", on your post, "{{{postIntro}}}"`),
        path: Handlebars.compile(`{{{ path }}}`)
    }
}
```

The `.hbs` body uses the `layout` partial (`definitions/layout.hbs`);
copy a neighbor's. The templates get the context the entity class builds.

## 3. Decide Who Gets It

In the entity's class in `packages/backend/services/notification/entities/`
(create one, following `PostCommentNotifications.js`, if the entity has
none):

- [ ] Add the type to the class's static `notifications` list, which is
      how `NotificationWorker` loads its definition.
- [ ] In `create()` or `update()`, for the event type, find the
      recipients and call
      `this.notificationWorker.createNotification(userId, type, context, options)`
      for each.
- [ ] Skip anyone who shouldn't get it: the person who caused it, and
      anyone who can no longer see the content (check with
      `permissionService.can()`).
- [ ] For a new entity class, construct it in `NotificationWorker` and add
      a branch for the entity in `processNotification()`.

## 4. Trigger It

In the controller, after the change is saved:

```javascript
await this.notificationService.sendNotifications(currentUser, 'PostComment:create', {
    post, commentAuthor: currentUser, comment: entity
})
```

Pass what the entity class needs; it loads the rest in its
`ensureContext()`.

## 5. Let Users Control It

Add the type to `web-application/client/pages/users/views/UserAccountNotificationsView.js`,
in an existing `NotificationSetting` or a new one with a label and
explanation. Settings default to on.

## 6. Test It

- [ ] A unit test in `packages/backend/test/services/notification/` for
      who gets it (see `PostCommentNotifications.spec.js`).
- [ ] Locally, with the worker running: the web notification appears, the
      email is in `tmp/email`, and the push is logged.
- [ ] Add it to the table in [Notifications](../domain/notifications.md).
