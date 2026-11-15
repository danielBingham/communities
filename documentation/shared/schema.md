# Schemas

A Schema defines, for each property of an entity, how to clean it and how
to validate it, in one place, for both the server and the client. Schemas
are replacing the older per-entity validators; see
[Validation and Cleaning](validation-and-cleaning.md).

**Code:** `packages/shared/schema/`

## Which Entities Have One

| Schema | File |
| ------ | ---- |
| `CommentReactionSchema` | `packages/shared/schema/CommentReaction.js` |
| `DeviceSchema` | `packages/shared/schema/Device.js` |
| `FileSchema` | `packages/shared/schema/File.js` |
| `GroupSchema` | `packages/shared/schema/Group.js` |
| `GroupSubscriptionSchema` | `packages/shared/schema/GroupSubscription.js` |
| `LogSchema` | `packages/shared/schema/Log.js` (client log messages) |
| `NewsSchema` | `packages/shared/schema/News.js` |
| `NotificationSchema` | `packages/shared/schema/Notification.js` |
| `SiteModerationSchema` | `packages/shared/schema/SiteModeration.js` |

`schema/User.js` exists but isn't exported or used yet.

## Defining One

A Schema extends `Schema` and fills `this.properties`, one entry per
property, each with a `clean` and a `validate` function:

```javascript
module.exports = class CommentReactionSchema extends Schema {
    constructor() {
        super()
        this.properties = {
            commentId: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('commentId', value, existing, action)
                    return validator
                        .isRequiredToCreate()
                        .mustNotBeUpdated()
                        .mustNotBeNull()
                        .mustBeUUID()
                        .getErrors()
                }
            },
            ...
        }
    }
}
```

- `clean` takes the raw value and returns a cleaned one: trimmed, converted
  to the right type, or `null`. Built from the cleaners in
  `cleaning/types/`.
- `validate(value, existing, action)` returns a list of errors. Built from
  a validator in `validation/types/`, whose chained rules each add an error
  if they fail. `existing` is the stored value on an update; `action` is
  create or update.

Allowed values belong on the class as statics
(`CommentReactionSchema.REACTIONS = [ 'like' ]`), so code can use them too.

## Using One

```javascript
const { schema } = require('@communities/shared')
const commentReactionSchema = new schema.CommentReactionSchema()

// Clean a request body: trims values, and leaves out any property the
// entity doesn't have.
const body = commentReactionSchema.clean(request.body)

// Clean and validate one route parameter.
const commentId = commentReactionSchema.properties.commentId.clean(request.params.commentId)
const errors = commentReactionSchema.properties.commentId.validate(commentId)

// Validate a whole entity: creating, or updating with what's stored.
const { all } = commentReactionSchema.validate(commentReaction, existing)
```

`validate()` returns `{ all: [...], <property>: [...] }`: every error, and
each property's errors.

| Where | Use |
| ----- | --- |
| Controllers | `clean()` the body, and clean and validate each route parameter before using it in a query. |
| `services/validation/<Entity>Validation.js` | `validate()` the entity, before the rules that need the database. See [Validation](../backend/validation.md). |
| The client | Validate form fields before submitting, with the same rules. |

## Adding One

Write a Schema for any new entity, and move an entity to a Schema when its
validation needs to change; see
[Move Validation to a Schema](../how-to/move-validation-to-a-schema.md).
Then export it from `schema/index.js` as `<Entity>Schema`, and test both
`clean()` and `validate()` in `packages/shared/test/schema/<Entity>.spec.js`.
