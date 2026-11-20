# Local Data

Where the local stack keeps its data, and how to start over.

**Code:** `compose.yaml`

| Data | Where it's kept |
| ---- | --------------- |
| The database | The `communities_postgres-data` volume, which Docker manages. |
| Redis (queues, rate limits) | The `communities_redis-data` volume. |
| Uploaded files, News | `local-data/storage` at the repository root (git ignores it). |
| Emails the `log` driver wrote | `web-application/tmp/email`, `worker/tmp/email`. |

The volumes last across `docker compose down`, rebuilds and
`docker compose up -V`, which only renews the containers' anonymous
`node_modules` volumes.

## Starting Over

To start over with an empty database, delete its volume while the stack is
down. The next `docker compose up` initializes a new one:

```
docker compose down
docker volume rm communities_postgres-data
```

`docker compose down -v` deletes both volumes at once. Delete
`local-data/storage` too if you want to lose the uploaded files.

Without Docker, drop the database and role and run `npm run db:init` again:

```
dropdb communities && dropuser app
```

## Keeping the Data in a Folder

To keep the data in a folder of your own instead, add a
`compose.override.yaml` next to `compose.yaml`. Compose reads it
automatically and git ignores it. A mount there for the same path in the
container replaces the volume:

```yaml
services:
  postgres:
    volumes:
      - /path/to/communities-sql:/var/lib/postgresql/data
  redis:
    volumes:
      - /path/to/communities-redis:/data
```
