# Groups

Groups: their types, membership and roles, posting rules, subgroups, and
notification subscriptions.

## A Group

`groups` holds each group's `title`, `slug` (its URL, `/group/<slug>`),
`short_description`, `about`, `rules`, picture (`file_id`), `type`,
`post_permissions`, `parent_id` for subgroups, and
counters (`total_members`, `total_posts`, `most_recent_post_date`) used for
sorting and finding active groups.

## Types

| Type | Who can see the group | Who can see its posts |
| ---- | --------------------- | --------------------- |
| `open` | Everyone. | Everyone. Anyone can join. |
| `private` | Everyone. | Members. Others request to join. |
| `hidden` | Members and invitees. | Members. Join by invitation only. |

A subgroup can also be:

| Type | Who can see it | Who can see its posts |
| ---- | -------------- | --------------------- |
| `private-open` | Everyone. | Its members, and members of its parent. |
| `hidden-open` | Members of its parent. | Its members, and members of its parent. |
| `hidden-private` | Members of its parent. | Its members. |

Banned members can't see the group at all. Site moderators can see every
group.

## Membership

`group_members` has a row per user per group, with a `status` and `role`:

| Status | Means |
| ------ | ----- |
| `pending-invited` | A moderator invited them; they haven't accepted. |
| `pending-requested` | They asked to join; a moderator hasn't accepted. |
| `member` | A member. |
| `banned` | Banned from the group. |

| Role | Can |
| ---- | --- |
| `member` | Post (as the group's post permissions allow), comment, react. |
| `moderator` | Also invite, accept requests, moderate posts and comments, ban. |
| `admin` | Also edit the group, change roles, delete the group. The creator is its first admin. |

Joining, inviting, requesting and accepting go through
`POST /group/:groupId/members` and `PATCH /group/:groupId/member/:userId`;
leaving or removing through `DELETE`. Admins of a parent group can add
themselves to its subgroups as admins. (`groups.entrance_questions` and
`group_members.entrance_answers` exist, but nothing uses them yet.)

## Posting

`post_permissions` decides who can post:

| Value | Who can post |
| ----- | ------------ |
| `anyone` | Anyone who can see the group. |
| `members` | Members. |
| `approval` | Members, but each post waits for a moderator to approve it (a `pending` group moderation), and only its author and moderators see it until then. |
| `restricted` | Moderators and admins. |

Posts in a group have `type: 'group'` and the group's id. Who can see one
follows the group's type, through `permissions.GroupPost`.

## Subgroups

Behind the `issue-165-subgroups` flag. A group with a `parent_id` is a
subgroup. The types above decide what the parent's members can see, and
`GroupService.getParentIds()` walks up the hierarchy for permission checks.

## Subscriptions

`group_subscriptions` holds each member's notification setting for a
group: `posts` (notify of new posts), `mentions` (only when mentioned), or
`unsubscribed`, read and changed with `GET` and `PATCH
/group/:groupId/subscription`. A member who's unsubscribed isn't subscribed
to posts in the group when they comment on them.

## Finding Groups

`/groups/find` searches groups by title, and lists active ones (sorted by
recent posts and members). Hidden groups only appear to those who can see
them.

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controllers | `web-application/server/controllers/GroupController.js`, `GroupMemberController.js`, `GroupSubscriptionController.js` |
| Data | `packages/backend/daos/GroupDAO.js`, `GroupMemberDAO.js`, `GroupSubscriptionDAO.js` |
| Services | `packages/backend/services/GroupService.js`, `GroupMemberService.js` |
| Schemas and validation | `packages/shared/schema/Group.js`, `GroupSubscription.js`; `packages/backend/services/validation/GroupValidation.js`, `GroupMemberValidation.js` |
| Permissions | `packages/shared/permissions/Group/`, `GroupMember/`, `GroupPost/`; `packages/backend/services/permission/GroupPermissions.js`, `GroupMemberPermissions.js`, `GroupPostPermissions.js` |
| Notifications | `packages/backend/services/notification/entities/GroupNotifications.js`, `GroupMemberNotifications.js` |
| Client | `web-application/client/state/Group/`, `state/GroupMember/`, `state/GroupSubscription/`, `lib/hooks/Group/`, `components/groups/`, `pages/group/`, `pages/groups/` |
| Tests | `web-application/test/integration/suites/GroupController/`, `GroupMemberController/` |
| Manual cases | `documentation/testing/test-cases/Group/`, `GroupMember/`, `GroupPost/` |
