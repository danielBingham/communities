# Shared

Orientation for `packages/shared` (`@communities/shared`): code that runs in
both the browser and Node, so the client and server apply the same rules.
It must not depend on anything that only runs in one of them.

## Where Things Are

| Path | What's there |
| ---- | ------------ |
| `schema/` | Schemas: for each property of an entity, how to clean it and how to validate it. |
| `validation/types/`, `cleaning/types/` | The type validators and cleaners Schemas are built from. |
| `validation/entities/`, `cleaning/entities/` | Per-entity validators and cleaners, **deprecated** in favor of Schemas. |
| `permissions/` | The permission rules for `Group`, `GroupMember`, `GroupPost` and `Post`, which the server's permission classes and the client's `can()` both use. |
| `lib/` | Helpers both sides need: mentions, dates, News, page metadata, preloaded entities. |

## Validation Is Moving to Schemas

Some entities have a Schema; the rest still use the deprecated validators,
and a few are partly moved. Write a Schema for any new entity, and move an
entity to one when its validation needs to change, as part of that change.
`CommentReaction` was moved this way (feat-268); follow it:

1. Create `schema/<Entity>.js`, with a `clean` and `validate` function per
   property (the old validator chains usually carry over as they are), and
   export it from `schema/index.js`.
2. Use it in `packages/backend/services/validation/<Entity>Validation.js`
   and in the controllers, to clean bodies and route parameters.
3. Replace the other uses of `validation.<Entity>`, in the client too.
4. Move the tests to `test/schema/`, adding tests for cleaning.
5. Delete the old validator (and cleaner), and remove them from their
   `index.js`.

## Permission Rules

A rule in `permissions/` gets everything it decides on in its context and
loads nothing. On the server, the entity's permission class gathers that
context; in the client, the context comes from the store. The client only
uses the rules to decide what to show: the server checks again.

## Tests

`npm test -w packages/shared`. See [Unit Tests](../testing/unit-tests.md).
