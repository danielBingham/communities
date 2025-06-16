const { UUIDValidator, DateValidator } = require('../types')
const { validateEntity } = require('../validate')

const validateId = function(id, existing) {
    const validator = new UUIDValidator('id', id, existing)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateUserId = function(userId, existing) {
    const validator = new UUIDValidator('userId', userId, existing)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validatePostId = function(postId, existing) {
    const validator = new UUIDValidator('postId', postId, existing)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateCreatedDate = function(createdDate, existing) {
    const validator = new DateValidator('createdDate', createdDate, existing)
    const errors = validator
        .mustNotBeSet()
        .getErrors()
    return errors
}

const validateUpdatedDate = function(updatedDate, existing) {
    const validator = new DateValidator('updatedDate', updatedDate, existing)
    const errors = validator
        .mustNotBeSet()
        .getErrors()
    return errors
}

const clean = function(postSubscription) {
    const cleaners = {
        id: null,
        userId: null,
        postId: null,
        createdDate: null,
        updatedDate: null
    }
    return cleanEntity(postSubscription, cleaners)
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
    clean: clean,
    validate: validate
}
