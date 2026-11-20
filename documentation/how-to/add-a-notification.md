# Add a Notification

How to notify users of something new: a definition with its templates, the
logic that decides who gets it, the trigger, and the setting that controls
it. How notifications flow is in
[Worker](../architecture/worker.md#notifications).

**Code:** `packages/backend/services/notification/`,
`web-application/client/pages/users/views/UserAccountNotificationsView.js`

## Checklist

- [ ] **Name the type** `<Entity>:<action>:...:<audience>`, after what
      causes it and who receives it: `PostComment:create:subscriber`. The
      controller sends the event part (`PostComment:create`); the entity's
      notification class turns it into one type per audience.
- [ ] **Write the definition** at
      `services/notification/definitions/<Entity>/<action>/.../<audience>.js`
      (its path is its type), with the email body beside it as
      `<audience>.hbs`. Copy a neighbor's: the templates get the context the
      entity class builds.
- [ ] **Add the type to the entity class's static `notifications` list**
      in `services/notification/entities/`. That list is how
      `NotificationWorker` loads definitions; a type missing from it isn't
      found.
- [ ] **Decide who gets it** in the class's `create()` or `update()`, and
      call `this.notificationWorker.createNotification()` for each
      recipient. Skip the person who caused it, and anyone who can no longer
      see the content.
- [ ] **For a new entity class**, construct it in `NotificationWorker` and
      add a branch for the entity in `processNotification()`.
- [ ] **Trigger it** from the controller, after the change is saved, with
      `this.notificationService.sendNotifications(currentUser, '<Entity>:<action>', context)`.
- [ ] **Let users control it:** add the type to
      `UserAccountNotificationsView.js`, in an existing `NotificationSetting`
      or a new one. Settings default to on.
- [ ] **Test it:** a unit test for who gets it (see
      `packages/backend/test/services/notification/PostCommentNotifications.spec.js`),
      and locally, with the worker running, check the web notification
      appears, the email is in `tmp/email`, and the push is logged.
