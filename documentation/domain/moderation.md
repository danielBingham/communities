# Moderation

How content is flagged and moderated, by site moderators across the whole
platform and by group moderators within their groups, and how users and
email domains are banned.

## Two Kinds

| | Site moderation | Group moderation |
| - | --------------- | ---------------- |
| Who decides | Site moderators and admins (`site_role`). | The group's moderators and admins. |
| What can be flagged | Posts, comments, groups and user profiles. | Posts and comments in the group. |
| Table | `site_moderation`, with history in `site_moderation_events` | `group_moderation`, with history in `group_moderation_events` |
| Statuses | `flagged`, `approved`, `rejected` | `flagged`, `pending`, `approved`, `rejected` |
| Queue | `/admin/moderation` | The group's moderation page. |
| Endpoints | `/admin/moderations`, `/admin/moderation/:id` | `/group/:groupId/moderations`, `/group/:groupId/moderation/:id` |

The flagged thing points at its moderation (`posts.site_moderation_id`,
`post_comments.group_moderation_id`, `groups.site_moderation_id`,
`users.site_moderation_id`), so queries can filter on it.

## The Flow

1. **A user flags** a post, comment, group or profile from its menu, with a
   reason. That creates a site moderation with status `flagged` or, for
   content in a group, a group moderation. Group moderators are notified of
   flags in their group.
2. **Moderators decide**, from their queue:
   - **Approve:** the content stays, and the flag is closed.
   - **Reject:** the content is hidden from everyone but its author and
     moderators, and the author is notified
     (`SiteModeration:update:post:status:rejected:author`,
     `GroupModeration:update:post:status:rejected:author`, and the comment
     equivalents).
3. **Posts in groups that require approval** start as `pending` group
   moderations; approving one publishes it, and the author is notified
   either way.

Rejected and pending content is left out of queries in SQL (see
`PostController.createQuery()`), except for its author.

## Banning

| Ban | How | Effect |
| --- | --- | ------ |
| From the site | A moderator sets the user's `status` to `banned` (`PATCH /user/:id`), from the admin user pages. | Their sessions are deleted, they can't log in, `PermissionService` refuses them everything, and they're hidden from other users. |
| From a group | A group moderator sets their membership's `status` to `banned`. | They can't see or rejoin the group. |
| An email domain | An admin adds it to the blocklist, at `/admin/blocklist`. | Nobody can register or be newly invited with an address at that domain. |

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controllers | `web-application/server/controllers/admin/SiteModerationController.js`, `web-application/server/controllers/GroupModerationController.js`, `web-application/server/controllers/admin/BlocklistController.js` |
| Data | `packages/backend/daos/SiteModerationDAO.js`, `SiteModerationEventDAO.js`, `GroupModerationDAO.js`, `GroupModerationEventDAO.js`, `BlocklistDAO.js` |
| Validation | `packages/shared/schema/SiteModeration.js`, `packages/backend/services/validation/SiteModerationValidation.js`, `GroupModerationValidation.js`, `BlocklistValidation.js` |
| Notifications | `packages/backend/services/notification/entities/SiteModerationNotifications.js`, `GroupModerationNotifications.js` |
| Client | `web-application/client/state/SiteModeration/`, `state/GroupModeration/`, `state/Blocklist/`, `components/admin/moderation/`, `components/groups/moderation/`, `pages/admin/` |
| Manual cases | `documentation/testing/test-cases/SiteModeration/`, `GroupModeration/` |
