/******************************************************************************
 * @deprecated Entity validation in `packages/shared/validation` is deprecated
 * in favor of the Schema classes in `packages/shared/schema`.  Don't add to
 * this file.  When this entity's validation needs to change, move it to a
 * Schema instead.  See packages/shared/validation/README.md.
 ******************************************************************************/
const { UUIDValidator, DateValidator } = require('../types')
const { validateEntity } = require('../validate')

const validateId = function(id, existing, action) {
    const validator = new UUIDValidator('id', id, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateUserId = function(userId, existing, action) {
    const validator = new UUIDValidator('userId', userId, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validatePostId = function(postId, existing, action) {
    const validator = new UUIDValidator('postId', postId, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateCreatedDate = function(createdDate, existing, action) {
    const validator = new DateValidator('createdDate', createdDate, existing, action)
    const errors = validator
        .mustNotBeSet()
        .getErrors()
    return errors
}

const validateUpdatedDate = function(updatedDate, existing, action) {
    const validator = new DateValidator('updatedDate', updatedDate, existing, action)
    const errors = validator
        .mustNotBeSet()
        .getErrors()
    return errors
}

/**
 * Validate a user-created PostSubscription entity.
 *
 * @param {PostSubscription} postSubscription The PostSubscription entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(postSubscription, existing) {
    let validators = {
        id: validateId,
        userId: validateUserId,
        postId: validatePostId,
        createdDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(postSubscription, validators, existing)
}

module.exports = {
    validateId: validateId,
    validateUserId: validateUserId,
    validatePostId: validatePostId,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    validate: validate
}
