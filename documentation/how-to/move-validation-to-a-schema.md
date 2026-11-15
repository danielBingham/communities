# Move Validation to a Schema

How to move an entity from the deprecated validators in
`packages/shared/validation/entities/` to a Schema. Do it when the entity's
validation needs to change, as part of that change. See
[Schemas](../shared/schema.md) and
[Validation and Cleaning](../shared/validation-and-cleaning.md).

CommentReaction was moved this way (feat-268); see
`packages/shared/schema/CommentReaction.js`.

## Steps

1. **Create the Schema.** `packages/shared/schema/<Entity>.js`, a class
   extending `Schema`. For each property, give it a `clean` function and a
   `validate` function. The validator chains can usually be copied from
   `validation/entities/<Entity>.js` as they are.
2. **Export it** from `packages/shared/schema/index.js` as
   `<Entity>Schema`.
3. **Use it in the backend's validation.** In
   `packages/backend/services/validation/<Entity>Validation.js`, create the
   Schema in the constructor, and replace
   `validation.<Entity>.validate(entity, existing)` with
   `this.schema.validate(entity, existing)`.
4. **Clean in the controllers.** Clean request bodies with
   `schema.clean(request.body)`, and clean and validate route parameters
   with `schema.properties.<property>`.
5. **Replace the other uses** of `validation.<Entity>` (in the client too)
   with `schema.properties.<property>.validate()`.
6. **Move the tests** from `packages/shared/test/validation/entities/<Entity>.spec.js`
   to `packages/shared/test/schema/<Entity>.spec.js`, and add tests for
   `clean()`.
7. **Delete** `validation/entities/<Entity>.js`, and remove it from
   `validation/index.js`. Delete its cleaner in `cleaning/entities/` too, if
   it has one.

Update the Schema table in [Schemas](../shared/schema.md).

## Partly Moved Entities

Some entities have a Schema but are still validated by the old validators
in places (`validation.User.validateEmail()`, `validation.Group.validatePostPermissions()`).
Move those uses when you're working on them.
