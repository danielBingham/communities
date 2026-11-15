# Shared

`packages/shared` (`@communities/shared`): code that runs in both the
browser and Node, so the client and server apply the same rules.

**Code:** `packages/shared/`

```javascript
const { schema, validation, cleaning, permissions, lib, util } = require('@communities/shared')
```

| Export | What it is |
| ------ | ---------- |
| `schema` | Schemas: cleaning and validation per entity. |
| `validation` | Type validators, and the deprecated per-entity validators. |
| `cleaning` | Type cleaners, and a few deprecated per-entity cleaners. |
| `permissions` | Permission rules for Group, GroupMember, GroupPost and Post. |
| `lib` | Mentions, dates, news, page metadata, preloaded entities. |
| `util` | `objectHas()`. |

| File | Read it when |
| ---- | ------------ |
| [schema.md](schema.md) | Cleaning or validating an entity, or writing a Schema. |
| [validation-and-cleaning.md](validation-and-cleaning.md) | Using a type validator or cleaner, or working with an entity still on the deprecated validators. |
| [permissions.md](permissions.md) | Changing a permission rule the client and server share, or using `can()` in the client. |
| [lib.md](lib.md) | Using a shared helper, or deciding whether code belongs in this package. |
