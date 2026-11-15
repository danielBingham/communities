# Validation and Cleaning

The building blocks Schemas are made from (type validators and cleaners),
and the deprecated per-entity validators that Schemas are replacing.

**Code:** `packages/shared/validation/`, `packages/shared/cleaning/`

## Type Validators

`validation/types/` (exported as `validation.types`) has a validator per
type: `StringValidator`, `NumberValidator`, `BooleanValidator`,
`UUIDValidator`, `EmailValidator`, `UrlValidator`, `DateValidator`,
`ArrayValidator`, `ObjectValidator`. They're not deprecated.

Each is constructed with the field's name, its value, the existing value
and the action, and its rules chain:

```javascript
new StringValidator('content', value, existing, action)
    .isRequiredToCreate()
    .mustNotBeNull()
    .mustBeString()
    .mustBeShorterThan(10000)
    .getErrors()
```

`BaseValidator` gives every validator the rules about presence and change:
`isRequiredToCreate()`, `isRequiredToUpdate()`, `mustNotBeUpdated()`,
`mustNotBeSet()`, `mustNotBeNull()`, `mustNotBeNullOnCreate()`. Each type
adds its own: `StringValidator` has `mustBeString()`, `mustNotBeEmpty()`,
`mustBeShorterThan()`, `mustBeLongerThan()`, `mustMatch()` and
`mustBeOneOf()`, for instance. Type and format rules skip a missing
(`undefined` or `null`) value, so only the presence rules report a missing
field.

Errors are `{ type: '<field>:<problem>', log, message }`.

## Cleaners

`cleaning/types/` (exported as `cleaning`) has a cleaner per type:
`stringCleaner`, `intCleaner`, `cleanNumber`, `cleanBoolean`, `cleanUuid`,
`cleanEmail`, `urlCleaner`. Each takes a raw value from a request and
returns it trimmed and converted, or `null` if it can't be. Schemas use
them in each property's `clean`.

## The Deprecated Validators

Before Schemas, each entity had a validator that only validated:

- `validation/entities/`: `validation.<Entity>.validate(entity, existing)`
  for Blocklist, Group, GroupMember, GroupModeration, LinkPreview, Post,
  PostComment, PostReaction, PostSubscription, Token, User and
  UserRelationship.
- `validation/validate.js`: `validateEntity()`, which they use.
- `cleaning/entities/`: separate cleaners for a few of them, or none.

**Don't add to them.** Write a Schema for a new entity, and when an
existing entity's validation needs to change, move it to a Schema as part
of that change; see
[Move Validation to a Schema](../how-to/move-validation-to-a-schema.md).

Some entities with a Schema are still validated by the old validators in
places (`validation.Group.validatePostPermissions()` in the client, for
instance), and `validation.User` is still used for email and birthdate.
Those uses should move to Schemas too.
