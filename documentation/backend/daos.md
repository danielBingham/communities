# DAOs

Data access objects: one class per entity (or small group of entities)
that owns its SQL. Built on the `DAO` base class, which maps columns to
entity properties.

**Code:** `packages/backend/daos/`, `packages/backend/daos/DAO.js`

## The Entity Map

Each DAO describes its tables in `this.entityMaps`, in its constructor:

```javascript
this.entityMaps = {
    'CommentReaction': {
        table: 'comment_reactions',
        fields: {
            'id':         { insert: 'primary',  update: 'primary', select: 'always', key: 'id' },
            'comment_id': { insert: 'required', update: 'denied',  select: 'always', key: 'commentId' },
            'reaction':   { insert: 'required', update: 'allowed', select: 'always', key: 'reaction' },
            'created_date': { insert: 'override', insertOverride: 'now()', update: 'denied', select: 'always', key: 'createdDate' },
            'updated_date': { insert: 'override', insertOverride: 'now()', update: 'override', updateOverride: 'now()', select: 'always', key: 'updatedDate' }
        }
    }
}
```

Each field maps a column to an entity property (`key`), and says how it may
be used:

| Setting | Values (`DAO.INSERT`, `DAO.UPDATE`, `DAO.SELECT`) |
| ------- | ------------------------------------------------- |
| `insert` | `primary`, `required`, `allowed`, `denied`, or `override` with `insertOverride` (SQL, like `now()`). |
| `update` | `primary` (goes in the `WHERE`), `required`, `allowed`, `denied`, or `override` with `updateOverride`. |
| `select` | `always`; `request` (only when asked for, like a user's email); `never` (like a password hash); or `override` with `selectOverride()`. |
| `needsFeature` | Optional: the field is only read when that feature flag is enabled, and is `null` otherwise. Lets a column added by a migration exist in code before it exists in the database. |

## The Methods

The base class provides the generic parts:

| Method | Does |
| ------ | ---- |
| `getSelectionString(entityName, requestedFields)` | The `SELECT` list, each column aliased `"<Entity>_<key>"`. |
| `hydrate(entityName, row)` | One row into an entity. |
| `insert(entityName, entities)` | Inserts one entity or an array, enforcing the `insert` rules. |
| `update(entityName, entity)` | Updates by primary key, only the properties present, enforcing the `update` rules. |

Each DAO adds, for its entity:

| Method | Returns |
| ------ | ------- |
| `select<Entities>(query)` | `{ dictionary, list }` |
| `get<Entity>ById(id)` and other `get<Entity>By...()` | The entity or `null`. |
| `get<Entity>PageMeta(query)` | `{ count, page, pageSize, numberOfPages }`, for queries that page. |
| `insert<Entities>(entities)`, `update<Entity>(entity)`, `delete<Entity>(entity)` | Nothing; read it back afterwards. |
| `hydrate<Entities>(rows)` | `{ dictionary, list }`, combining joined rows (comments, files) into one entity each. |

## The Query Object

`select<Entities>()` takes:

```javascript
{
    where: `posts.user_id = $1 AND posts.visibility = $2`,
    params: [ userId, 'public' ],
    order: 'posts.created_date DESC',
    page: 2
}
```

- `where` is SQL with numbered placeholders; values only ever go in
  `params`. Add to `params` and use `$${params.length}` when building it up.
- `order` is SQL. Build it from a fixed list of allowed orders, never from
  the request.
- `page` (from 1) pages the results, `PAGE_SIZE` (usually 20) at a time.
  Paging DAOs select the page's ids first, then the rows for those ids, so
  joins don't throw off the count.

## Writing a DAO

1. Extend `DAO`, and describe every column in `entityMaps`.
2. Add `select`, `get...ById`, `insert`, `update` and `delete` methods,
   following `CommentReactionDAO.js` (small) or `PostDAO.js` (with joins and
   paging).
3. Export it from `packages/backend/index.js`.

Keep permission and validation logic out: a DAO returns whatever the query
asks for. Callers make sure the query only asks for what the user may see.
