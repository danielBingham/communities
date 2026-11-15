# Data Model

The tables, grouped by what they're for, and how they relate. The columns
themselves are in `schema.sql`, which is always the current schema.

**Code:** `database/initialization-scripts/schema.sql`

## Users and Relationships

| Table | Holds |
| ----- | ----- |
| `users` | Accounts: name, username, email, password hash, birthdate, `status`, `site_role`, profile (`about`, `file_id` for the picture via `files`), `settings` and `notices` (JSON), privacy (`privacy__view_friends`, `privacy__view_mutual_friends`), login lockout counters, and MFA state and encrypted secret (`authentication__multifactor_*`). |
| `user_recovery_codes` | Hashed MFA recovery codes, one row each. |
| `user_relationships` | A relationship from `user_id` (who asked) to `friend_id`: `pending`, `confirmed` or `blocked`. One row per pair. |
| `mutual_relationships` | Precomputed mutual friends: `mutual_id` is a friend of both `current_id` and `target_id`. Maintained by the worker. |
| `tokens` | Single-use tokens for `email-confirmation`, `reset-password` and `invitation`, with who created them. |
| `blocklist` | Email domains that can't register. |
| `session` | Sessions, created by `connect-pg-simple` (not in `schema.sql`). |

## Content

| Table | Holds |
| ----- | ----- |
| `posts` | Posts: author, `type`, `visibility`, `group_id` for group posts, `shared_post_id` for shares, `link_preview_id`, `content`, moderation ids, and `activity` (for sorting the feed by activity). |
| `post_files` | The images and videos attached to a post, in `position` order. |
| `post_versions` | Earlier versions of edited posts. |
| `post_comments` | Comments, with moderation ids. |
| `post_comment_versions` | Earlier versions of edited comments. |
| `post_reactions` | One reaction per user per post (`reaction_type`). |
| `comment_reactions` | One reaction per user per comment (`comment_reaction_type`; so far, `like`). |
| `post_subscriptions` | Users subscribed to a post's comments. |
| `files` | Uploaded images and videos: owner, `state`, `kind`, `mimetype`, the Bull `job_id` processing it, its `variants` in storage, and `thumb_id` (a video's poster). |
| `link_previews` | Previews made for URLs, kept and reused per URL, with the image saved as a file. |

## Groups

| Table | Holds |
| ----- | ----- |
| `groups` | Groups: `type`, `post_permissions`, `title`, `slug`, descriptions and rules, `parent_id` for subgroups, the picture, entrance questions, and counters (`total_members`, `total_posts`, `most_recent_post_date`). |
| `group_members` | Membership: `status` (`pending-invited`, `pending-requested`, `member`, `banned`), `role`, and answers to entrance questions. |
| `group_subscriptions` | Each member's notification setting for a group: `unsubscribed`, `mentions` or `posts`. |

## Moderation

| Table | Holds |
| ----- | ----- |
| `site_moderation`, `site_moderation_events` | Flags for site moderators, on a post, comment, group or profile, with their `status` and history. |
| `group_moderation`, `group_moderation_events` | Flags for group moderators, on a post or comment in their group, with their status and history. |

A flagged entity points at its moderation row (`posts.site_moderation_id`,
`groups.site_moderation_id`, ...).

## Notifications and Features

| Table | Holds |
| ----- | ----- |
| `notifications` | Web notifications: recipient, `type`, text, link `path`, `is_read`. |
| `features` | Feature flags and their `status`. See [Feature Flags and Migrations](../backend/feature-flags-and-migrations.md). |

## Not in Use

| Table or column | Notes |
| --------------- | ----- |
| `tags`, `post_tags` | Defined, not used by any code. |
| `roles`, `user_roles`, `permissions` | An earlier permission design. Only `PermissionDAO` refers to them, and nothing uses it. |
| `tokens_hash_migration` | A backup the MFA migration keeps of token data. |
| `users.permissions`, `users.invitations` | Marked deprecated; `site_role` replaced `permissions`. |

Leave them alone unless you're removing them deliberately, with a
migration.
