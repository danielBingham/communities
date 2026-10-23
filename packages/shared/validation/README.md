# Validation (deprecated)

Entity validation in this directory is **deprecated** in favor of the Schema
classes in [`packages/shared/schema`](../schema).

That means:

- `entities/`: the per-entity validators, exported as `validation.<Entity>`
  (for example `validation.PostComment.validate()`).
- `validate.js`: `validateEntity()`, which they use.

Don't add new entities here; write a Schema instead. When an entity's
validation needs to change, move it to a Schema as part of that change.

## What isn't deprecated

The field validators in [`types/`](types) (`UUIDValidator`, `StringValidator`,
`DateValidator` and so on, exported as `validation.types`) are not deprecated.
The Schemas are built from them, along with the cleaners in
[`../cleaning/types`](../cleaning/types).

## Why Schema

A Schema defines, for each property of an entity, both how to clean it and how
to validate it, in one place:

```javascript
const { schema } = require('@communities/shared')

const commentReactionSchema = new schema.CommentReactionSchema()

// In a controller: clean the request body.  This trims values and leaves out
// any property the entity doesn't have.
const body = commentReactionSchema.clean(request.body)

// Or clean and validate a single route parameter.
const commentId = commentReactionSchema.properties.commentId.clean(request.params.commentId)
const errors = commentReactionSchema.properties.commentId.validate(commentId)

// In a validation service: validate the whole entity, creating or updating.
const validationErrors = commentReactionSchema.validate(commentReaction, existing)
```

The old validators only validate, so cleaning lives separately (in
`../cleaning/entities`) or doesn't happen at all.

## Moving an entity to a Schema

CommentReaction was moved this way (feat-268); see
[`../schema/CommentReaction.js`](../schema/CommentReaction.js).

1. Create `schema/<Entity>.js`, a class extending `Schema`. For each property,
   give it a `clean` function and a `validate` function. The validator chains
   can usually be copied from `validation/entities/<Entity>.js` as they are.
2. Export it from `schema/index.js` as `<Entity>Schema`.
3. In `packages/backend/services/validation/<Entity>Validation.js`, create the
   Schema in the constructor and replace
   `validation.<Entity>.validate(entity, existing)` with
   `this.schema.validate(entity, existing)`.
4. In the controllers, clean request bodies with `schema.clean(request.body)`,
   and clean and validate route parameters with `schema.properties.<property>`.
5. Replace any other uses of `validation.<Entity>` with
   `schema.properties.<property>.validate()`.
6. Move the tests from `test/validation/entities/<Entity>.spec.js` to
   `test/schema/<Entity>.spec.js`, and add tests for `clean()`.
7. Delete `validation/entities/<Entity>.js` and remove it from
   `validation/index.js`.

Some entities already have a Schema but are still validated here in places.
For example, `validation.User.validateEmail()` is still used even though
`UserSchema` exists. Those uses should move to the Schema too.
