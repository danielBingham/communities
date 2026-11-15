# Relationships

Friends, friend requests, blocking, and mutual friends. A relationship
decides much of what users can see of each other: private posts, friends
lists, profiles.

## The Relationship

`user_relationships` has one row per pair of users, from `user_id` (who
acted first) to `friend_id`, with a `status`:

| Status | Means |
| ------ | ----- |
| `pending` | `user_id` sent `friend_id` a friend request. |
| `confirmed` | They're friends. |
| `blocked` | `user_id` blocked `friend_id`. |

The API addresses it from either user's side:
`/user/:userId/relationship/:relationId`.

## What Users Do

| Action | Request | Result |
| ------ | ------- | ------ |
| Send a friend request | `POST /user/:userId/relationships` with `relationId` | A `pending` row, and a notification to the other user. If they'd already sent one, this confirms it instead. |
| Accept | `PATCH /user/:userId/relationship/:relationId`, `status: 'confirmed'` | Friends. Notifies the requester, and queues `add-mutuals-for-relationship`. |
| Decline, cancel or unfriend | `DELETE /user/:userId/relationship/:relationId` | The row is removed. Ending a friendship queues `remove-mutuals-for-relationship`. |
| Block | `POST /user/:userId/relationships` with `status: 'blocked'` | Any existing relationship is replaced by a block. |
| Unblock | `DELETE` the block | |

The client resets every entity slice after friending or unfriending
(`resetEntities()`), since what the user can see has changed everywhere.

## What Blocking Does

Blocking hides users from each other in both directions: their posts,
comments and profiles are left out of queries and relations, and neither
can comment on or react to the other's content. Site moderators still see
everything.

## Mutual Friends

`mutual_relationships` precomputes mutual friends: a row says `mutual_id`
is a friend of both `current_id` and `target_id`. It's kept current by the
worker's mutuals jobs when friendships start and end (`MutualsService`),
rather than computed on each request. Who can see a user's mutual friends
is their `privacy__view_mutual_friends` setting.

## Friends Pages

`/friends` shows a user's friends, with tabs for requests they've
received, people they've invited, finding people, and inviting new people
(see [Registration and Onboarding](registration-and-onboarding.md#invitations)).
A profile's friends list is at `/<username>/friends`, visible according to
`privacy__view_friends`.

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controller | `web-application/server/controllers/UserRelationshipController.js` |
| Data | `packages/backend/daos/UserRelationshipDAO.js`, the `user_relationships` and `mutual_relationships` tables |
| Services | `packages/backend/services/UserRelationshipService.js`, `MutualsService.js` |
| Permissions | `packages/backend/services/permission/UserRelationshipPermissions.js` |
| Worker | `worker/jobs/addMutualsForRelationship.js`, `removeMutualsForRelationship.js` |
| Notifications | `packages/backend/services/notification/entities/UserRelationshipNotifications.js` |
| Client | `web-application/client/state/UserRelationship/`, `state/Mutuals/`, `components/friends/`, `pages/friends/` |
| Tests | `web-application/test/integration/suites/UserRelationshipController/` |
| Manual cases | `documentation/testing/test-cases/UserRelationship/` |
