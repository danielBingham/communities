# Local Storage

What the client keeps in the browser's local storage, how, and how its
format is migrated.

**Code:** `web-application/client/lib/localStorage/`,
`web-application/client/lib/hooks/useLocalStorage.js`,
`web-application/client/lib/hooks/usePostDraft.js`,
`web-application/client/migrations/StorageMigrations.js`

## What's Kept

| Key | What | Written by |
| --- | ---- | ---------- |
| `version` | The storage format's version, for migrations. | `migrateLocalStorage()` |
| `post.draft[<key>]` | A post draft: new, editing, in a group, or sharing a post. | `usePostDraft()` |
| `commentDraft.<postId>` | A comment draft. | `PostCommentForm` |
| `FeedMenu.*`, `NavigationSubmenu.<id>.isOpen` | Which menus are open, and the menu's page. | `useLocalStorage()` |

Nothing sensitive goes in local storage. The apps keep the session ID in
the device's secure storage instead (Capacitor's secure storage plugin),
read by `makeRequest()`.

Logging out clears local storage, so drafts don't carry over to the next
person to log in.

## Using It

- **Check it's there:** `isLocalStorageAvailable()` before any direct use;
  it can be missing or full, and throw.
- **For component state that should survive a reload**, use
  `useLocalStorage(key, defaultValue)`, which works like `useState` and
  falls back to the default if storage isn't available. Name keys
  `<Component>.<what>`.
- **Store JSON**, and read it defensively: parse in a `try`, and check the
  shape before using it.

## Drafts

`usePostDraft()` keeps a post's draft in the `Post` slice's `drafts` and
mirrors it to local storage, keyed by what's being drafted (`postId:new`,
`postId:<id>`, plus the group or shared post). Reading a draft runs it
through `validateAndCorrectDraft()`, which fills in or fixes fields from
older formats, so a draft saved by an earlier version still loads.

## Migrations

When the format of what's stored changes in a way the reading code can't
handle, add a migration:

1. In `migrations/StorageMigrations.js`, write
   `migrateVersion<N>to<N+1>()`.
2. Add it to the end of `migrations` (order matters), and increase
   `currentVersion`.

`App` runs `migrateLocalStorage()` once initialization succeeds. It runs
every migration from the stored `version` up to `currentVersion`, then
saves the new version. The only migration so far (0 to 1) clears storage.
