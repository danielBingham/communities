# Posts and Feeds

Posts, who can see them, how they're edited and shared, and the feeds that
list them.

## A Post

| Part | Columns (`posts`) | Notes |
| ---- | ----------------- | ----- |
| Author | `user_id` | |
| Where | `type`, `group_id` | `feed` (the author's own), `group`, `announcement`, `info` (and `event`, unused). |
| Who sees it | `visibility` | `public` or `private`. |
| Content | `content` | Up to 10,000 characters, with `@username` mentions. |
| Attachments | `post_files` (in `position` order), `link_preview_id` | Images or a video, and a link preview. See [Files and Media](files-and-media.md) and [Link Previews](link-previews.md). |
| Sharing | `shared_post_id` | The post this one shares. |
| Moderation | `site_moderation_id`, `group_moderation_id` | See [Moderation](moderation.md). |
| Sorting | `activity` | Goes up with each comment, for sorting by activity. |

## Who Sees a Post

| Post | Visible to |
| ---- | ---------- |
| `public` feed post | Every logged-in user. |
| `private` feed post | The author and their friends. |
| Group post | Whoever can see the group's posts (see [Groups](groups.md)). Posts awaiting approval or rejected are only visible to their author and moderators. |
| `announcement`, `info` | Everyone; only admins can make them, and they must be public. |
| Any post | Not to users the author has blocked or been blocked by. Always to site moderators. |
| Rejected by site moderators | Only the author (and moderators). |

The rule is `permissions.Post.canViewPost()` (shared), and the same rules
are written in SQL in `PostController.createQuery()` for feeds.

## Making and Editing

- **Creating** (`POST /posts`, from `/create` or a feed's form) takes the
  content, visibility, files and link preview. Mentions notify the
  mentioned users; group posts notify subscribers. Posts to groups that
  require approval get a `pending` group moderation.
- **Editing** (`PATCH /post/:id`) is only for the author. Each edit saves
  the previous version in `post_versions`.
- **Deleting** (`DELETE /post/:id`) is only for the author. Moderators
  remove posts by rejecting them instead (see [Moderation](moderation.md)).
- **Drafts** are kept in the client, per post (new, editing, in a group,
  sharing), and survive reloads. See [Local Storage](../client/local-storage.md).
- **Sharing** makes a new post with `shared_post_id`, which can't also
  have files or a link preview. The client only offers Share on public
  posts, and if the original is later made private, shares stop showing
  it.

## Feeds

`GET /posts` takes filters in its query string:

| Parameter | Values |
| --------- | ------ |
| `feed` | `everything` (the home feed: friends' posts, posts in the user's groups, and announcements and info posts unless the user hid them), or `friends`. |
| `place` | `global`: every public post. |
| `groupId`, `groupSlug` | A group's posts. |
| `userId`, `username` | A user's posts. |
| `type` | A post type. |
| `since` | `day`, `week` or `month`. |
| `sort` | `newest` (the default) or `active`. |
| `page` | From 1, 20 posts a page. |

The client's routes for them: `/` and `/f/<feed>`, `/p/<place>`,
`/g/<group slug>`, and profiles at `/<username>`. A single post is at
`/<username>/<post id>`.

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controller | `web-application/server/controllers/PostController.js` |
| Data | `packages/backend/daos/PostDAO.js`, the `posts`, `post_files` and `post_versions` tables |
| Validation | `packages/shared/validation/entities/Post.js`, `packages/backend/services/validation/PostValidation.js` |
| Permissions | `packages/shared/permissions/Post/`, `GroupPost/`; `packages/backend/services/permission/PostPermissions.js` |
| Notifications | `packages/backend/services/notification/entities/PostNotifications.js` |
| Client | `web-application/client/state/Post/`, `lib/hooks/Post/`, `lib/hooks/usePostDraft.js`, `components/posts/`, `components/feeds/`, `pages/posts/` |
| Tests | `web-application/test/integration/suites/PostController/`, `web-application/test/e2e/suites/Post/` |
| Manual cases | `documentation/testing/test-cases/Post/` |
