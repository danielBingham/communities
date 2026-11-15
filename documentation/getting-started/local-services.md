# Local Services

What the environment-variable configuration uses in place of the outside
services staging and production rely on, and where to find what they
produce. How drivers are chosen and implemented is in
[Drivers](../backend/drivers.md).

**Code:** `packages/backend/services/email/`, `packages/backend/services/storage/`,
`packages/backend/services/push/`, `web-application/scripts/seed-storage.js`

| Service | Staging and production | Local stand-in |
| ------- | ---------------------- | -------------- |
| Email | `postmark` driver | `log` driver: nothing is sent |
| File storage | `s3` driver | `filesystem` driver: files in `local-data/storage` |
| Push notifications | `ios` and `android` drivers | `log` driver: nothing is sent |

## Email

The `log` email driver sends nothing. It logs each message with its
recipient, subject and links, and with `directory: 'tmp/email'` also writes
the whole message as a JSON file under each app's `tmp/email` folder
(`web-application/tmp/email`, `worker/tmp/email`). That's where you'll find
account confirmation, password reset and invitation links.

## Storage

The `filesystem` storage driver keeps uploaded images, videos and their
processed variants under `local-data/storage` at the repository root.
Docker Compose mounts that folder into both containers. The web application
serves the files from `/api/0.0.0/storage/` with links signed by
`COMMUNITIES_STORAGE_FILESYSTEM_SECRET`. The driver can only be used in
development.

### Seeding Assets

Two assets the web application serves come from storage's `assets`
folder: `intro-video.mp4` (the welcome notice's video) and
`daniel-headshot.jpg`. Give new local storage placeholder copies
with:

```
npm run storage:seed
```

It only adds files that are missing, so it never replaces real ones.

### News

News posts (`/about/news`) are kept in storage too, in one JSON file,
`news/index.json`, keyed by each post's slug. New local storage has none,
so the News page starts empty. Write one from the admin dashboard (see
[Your First Account](your-first-account.md)), or copy an `index.json` into
`local-data/storage/news/`.

### Using an S3-Compatible Server

The `s3` driver also works with an S3-compatible server such as
[Garage](https://garagehq.deuxfleurs.fr/) or
[SeaweedFS](https://github.com/seaweedfs/seaweedfs), to exercise the S3 code
path locally. In the `storage.s3` block of both apps' configuration:

| Setting | Value |
| ------- | ----- |
| `endpoint` | The server's S3 API, for example `'http://localhost:3900'`. |
| `region` | Only if the server expects something other than `us-east-1`. |
| `public_endpoint` | The address your browser uses, if the apps reach the server at a different one (a container hostname, say). Signed links use it. |

Buckets on a custom endpoint are addressed by path.

## Push Notifications

The `log` push driver sends nothing: it logs each notification with its
type, recipient, text and link. It can only be used in development. An
empty or missing `notifications` block turns push notifications off
entirely. Either way, notifications still appear in the app and are
emailed; the block only decides where pushes to phones go.
