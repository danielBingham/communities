# Validation

How entities are validated before they're written: field rules in shared
Schemas, plus rules that need the database in the backend's validation
classes.

**Code:** `packages/backend/services/ValidationService.js`,
`packages/backend/services/validation/`, `packages/shared/schema/`

## Two Levels

| Level | Where | Checks | Runs in |
| ----- | ----- | ------ | ------- |
| **Fields** | The entity's Schema in `packages/shared/schema/` (or, for entities not moved yet, the deprecated validator in `packages/shared/validation/entities/`) | Types, required fields, lengths, formats, allowed values. | Server and client. |
| **Entity** | `services/validation/<Entity>Validation.js` | Everything that needs the database or other entities: referenced ids exist, the change is allowed from the existing state, combinations make sense. | Server only. |

The field rules are in [Schemas](../shared/schema.md).

## Using It

Controllers call `ValidationService`, which hands off to the entity's
class:

```javascript
const errors = await this.validationService.validateCommentReaction(currentUser, reaction, existing)
if ( errors.length > 0 ) {
    // 400 invalid, with every error
}
```

- `currentUser`: who's making the change, for rules that depend on it.
- The entity: what would be written (for an update, only the fields being
  changed, plus `id`).
- `existing`: for an update, the entity as stored, so rules can compare
  (a status can only move in certain directions). Leave it out for a
  create.

It returns a list of errors, never throws for invalid input. It throws
`ServiceError` only for misuse, such as an `existing` with a different id.

## Errors

Each error is:

```javascript
{
    type: 'postId:not-found',           // `<field>:<problem>`
    log: `Post(${postId}) not found.`,  // for the server's log
    message: 'Post not found for that postId.',  // for the user
    context: { ... }                    // optional
}
```

Controllers send them with `sendUserErrors()` or a `ControllerError`; see
[Responses and Errors](../server/responses-and-errors.md).

## An Entity Validator

`CommentReactionValidation.js` is the model:

1. Create the entity's Schema in the constructor.
2. In `validate<Entity>(currentUser, entity, existing)`, run
   `this.schema.validate(entity, existing)` and stop if the fields are
   invalid.
3. Then check what needs the database, collecting errors.
4. Return the list.

To add one, create the class, construct it in `ValidationService`'s
constructor, add a `validate<Entity>()` method there that calls it, and add
tests in `packages/backend/test/services/ValidationService/`.

## Validation Isn't Permission

Validation answers "is this a valid entity?", never "may this user do
this?". Permission checks happen before validation, in the controller,
through [Permissions](permissions.md).
