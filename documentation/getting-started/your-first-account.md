# Your First Account

How to get an account on your local stack, make it an administrator, and
what the admin dashboard gives you.

**Code:** `database/helper/promote-superadmin`,
`web-application/client/pages/admin/`

## Registering

1. Open `https://localhost:3000/register` and register. Registration logs
   you in.
2. Confirm your email. Nothing is sent locally: the confirmation email is
   logged by the web application and saved under `web-application/tmp/email`
   (see [Local Services](local-services.md)). Open the link it contains.
3. Accept the Terms of Service when the app asks.

The integration and end-to-end tests make their own accounts and delete
them afterwards, so you don't need to create any for them.

## Making Yourself an Administrator

Site roles are `user`, `moderator`, `admin` and `superadmin`. Set yours
directly in the database. With Docker:

```
docker compose exec postgres psql -U app communities \
    -c "UPDATE users SET site_role = 'superadmin' WHERE username = '<username>';"
```

Without Docker, run the same `UPDATE` with `psql communities`. Log out and
back in to pick up the new role. (This is the same statement
`database/helper/promote-superadmin` runs on staging.)

## The Admin Dashboard

Administrators get an Admin item in the menu, which opens `/admin`:

| Section | Path | What it's for |
| ------- | ---- | ------------- |
| Dashboard | `/admin` | Site statistics. |
| Features | `/admin/features` | Feature flags and their migrations: insert, initialize, migrate, enable, disable, roll back. See [Feature Flags and Migrations](../backend/feature-flags-and-migrations.md). |
| News | `/admin/news/create` | Writing News posts for `/about/news`. |
| Users | `/admin/users` | Finding and administering accounts. |
| Moderation | `/admin/moderation` | The site moderation queue. |
| Blocklist | `/admin/blocklist` | Email domains that can't register. |

Features and News need the `admin` or `superadmin` role; moderators see the
rest.

## Features in a New Database

`schema.sql` is the schema with every migration applied, and it inserts the
current feature flags as already enabled. So a new local database has every
feature on, and you only use the Features page for flags added since (or to
test migrations you're writing).
