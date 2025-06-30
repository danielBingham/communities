const { StringValidator, UUIDValidator, DateValidator } = require('../types')
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
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateGroupId = function(groupId, existing, action) {
    const validator = new UUIDValidator('groupId', groupId, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateStatus = function(value, existing, action) {
    const validator = new StringValidator('status', value, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeOneOf(['flagged', 'approved', 'rejected'])
        .getErrors()
    return errors
}

const validateReason = function(value, existing, action) {
    const validator = new StringValidator('reason', value, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(5000)
        .getErrors()
    return errors
}

const validatePostId = function(value, existing, action) {
    const validator = new UUIDValidator('postId', value, existing, action)
    const errors = validator
        .mustNotBeUpdated()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validatePostCommentId = function(value, existing, action) {
    const validator = new UUIDValidator('postCommentId', value, existing, action)
    const errors = validator
        .mustNotBeUpdated()
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
 * Validate a user-created GroupModeration entity.
 *
 * @param {GroupModeration} groupModeration The GroupModeration entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(groupModeration, existing) {
    const validators = {
        id: validateId,
        userId: validateUserId,
        groupId: validateGroupId,
        status: validateStatus,
        reason: validateReason,
        postId: validatePostId,
        postCommentId: validatePostCommentId,
        createdDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(groupModeration, validators, existing)
}

module.exports = {
    validateId: validateId,
    validateUserId: validateUserId,
    validateGroupId: validateGroupId,
    validateStatus: validateStatus,
    validateReason: validateReason,
    validatePostId: validatePostId,
    validatePostCommentId: validatePostCommentId,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    validate: validate
}
