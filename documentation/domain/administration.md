# Administration

The admin dashboard, at `/admin`, and what site moderators and admins can
do there.

## Who Gets In

| Role | Sees |
| ---- | ---- |
| `moderator` | The dashboard, users, moderation, the blocklist. |
| `admin`, `superadmin` | Also feature flags and News. |

The client redirects anyone else to `/`; every endpoint behind the pages
checks the same permissions (`can(user, 'moderate', 'Site')` or
`can(user, 'admin', 'Site')`).

## The Sections

| Section | Path | Endpoints | What it's for |
| ------- | ---- | --------- | ------------- |
| Dashboard | `/admin` | `GET /admin/stats` | Site statistics by month: new users, daily and monthly active users, posts, moderations. |
| Users | `/admin/users`, `/admin/user/:userId` | `GET /users`, `GET` and `PATCH /user/:id`, `GET /admin/user/:userId/post_comments` | Finding users (by email too), seeing their details and comments, banning them. |
| Moderation | `/admin/moderation` | `/admin/moderations`, `/admin/moderation/:id` | The site moderation queue. See [Moderation](moderation.md). |
| Blocklist | `/admin/blocklist` | `/admin/blocklists`, `/admin/blocklist/:id` | Email domains that can't register, with notes. |
| News | `/admin/news/create`, `/admin/news/:slug/edit` | `/news`, `/news/:slug` | Writing News posts. See [News and About Pages](news-and-about-pages.md). |
| Features | `/admin/features` | `/features`, `/feature/:name` | Feature flags and their migrations. See [Feature Flags and Migrations](../backend/feature-flags-and-migrations.md). |

## Announcements and Info Posts

Admins can make posts of type `announcement` and `info`, which go to
everyone's home feed (unless they've hidden them in their preferences).
See [Posts and Feeds](posts-and-feeds.md).

## Getting Admin Locally

See [Your First Account](../getting-started/your-first-account.md).

## Where the Code Is

| Layer | Code |
| ----- | ---- |
| Controllers | `web-application/server/controllers/admin/`, `web-application/server/controllers/FeatureController.js`, `NewsController.js`, `UserController.js` |
| Client | `web-application/client/pages/admin/`, `components/admin/`, `state/admin.js` |
| Manual cases | `documentation/testing/test-cases/SiteModeration/` |
