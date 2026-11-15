# Comments and Reactions

Comments on posts, reactions to posts and comments, and the subscriptions
that decide who's notified of new comments.

## Comments

`post_comments` holds a post's comments: author, `content` (with
`@username` mentions), and moderation ids.

| Action | Request | Notes |
| ------ | ------- | ----- |
| Read | `GET /post/:postId/comments`, `GET /post/:postId/comment/:id` | Usually arrive as relations of the post instead. Comments by users the reader blocked (or who blocked them) are left out. |
| Comment | `POST /post/:postId/comments` | Anyone who can see the post. Raises the post's `activity`, subscribes the commenter to the post, and notifies (see below). |
| Edit | `PATCH /post/:postId/comment/:id` | The author. Each edit saves the previous version in `post_comment_versions`. |
| Delete | `DELETE /post/:postId/comment/:id` | The author. Lowers the post's `activity`. |

Comment drafts are kept in local storage per post
(`commentDraft.<postId>`). Moderators can flag and reject comments like
posts; see [Moderation](moderation.md).

## Who's Notified of a Comment

A new comment sends `PostComment:create`, which the worker's
`PostCommentNotifications` turns into:

| Notification | To |
| ------------ | -- |
| `PostComment:create:author` | The post's author, if they're subscribed (unless they're mentioned, so they don't get two). |
| `PostComment:create:subscriber` | Everyone else subscribed to the post. |
| `PostComment:create:mention` | Everyone mentioned in the comment. |

Each is only sent to someone who can still see the post and the comment,
and never to the comment's author. See [Notifications](notifications.md).

## Post Subscriptions

`post_subscriptions` records who follows a post's comments.

- Authors are subscribed to their own posts when they post.
- Commenters are subscribed when they comment, unless the post is in a
  group they've unsubscribed from.
- Users subscribe and unsubscribe from a post's menu:
  `POST /post/:postId/subscriptions`, `DELETE /post/:postId/subscription`.

## Post Reactions

`post_reactions` holds at most one reaction per user per post, of type
`like`, `dislike` or `block` (`reaction_type`).

| Action | Request |
| ------ | ------- |
| React | `POST /post/:postId/reactions` |
| Change it | `PATCH /post/:postId/reaction` |
| Remove it | `DELETE /post/:postId/reaction` |

Anyone who can see a post can react to it; only the user can change or
remove their reaction.

## Comment Reactions

Behind the `feat-268-comment-reactions` flag. `comment_reactions` holds at
most one reaction per user per comment (enforced by a unique constraint),
and the only type so far is `like`.

| Action | Request |
| ------ | ------- |
| Like | `POST /post/:postId/comment/:commentId/reactions` |
| Unlike | `DELETE /post/:postId/comment/:commentId/reaction` |

Users can't react to their own comments, or to comments they can't see.
Both responses include the comment as a relation, with its updated
`reactions`, so the client can update it.

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controllers | `web-application/server/controllers/PostCommentController.js`, `PostReactionController.js`, `CommentReactionController.js`, `PostSubscriptionController.js` |
| Data | `packages/backend/daos/PostCommentDAO.js`, `PostReactionDAO.js`, `CommentReactionDAO.js`, `PostSubscriptionDAO.js` |
| Schemas and validation | `packages/shared/schema/CommentReaction.js`; `packages/shared/validation/entities/PostComment.js`, `PostReaction.js`, `PostSubscription.js`; `packages/backend/services/validation/` |
| Permissions | `packages/backend/services/permission/PostCommentPermissions.js`, `PostReactionPermissions.js`, `CommentReactionPermissions.js`, `PostSubscriptionPermissions.js` |
| Notifications | `packages/backend/services/notification/entities/PostCommentNotifications.js`, `definitions/PostComment/` |
| Client | `web-application/client/state/PostComment/`, `state/PostReaction/`, `state/CommentReaction/`, `state/PostSubscription/`, `components/posts/PostComment/`, `components/posts/PostCommentForm/` |
| Tests | `web-application/test/integration/suites/CommentReactionController/` |
| Manual cases | `documentation/testing/test-cases/PostComment/`, `PostReaction/`, `CommentReaction/`, `PostSubscription/` |
