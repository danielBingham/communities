const { UUIDValidator, StringValidator } = require('../types')
const { validateEntity } = require('../validate')

const validateUserId = function(userId) {
    const validator = new UUIDValidator('userId', userId)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validatePostId = function(postId) {
    const validator = new UUIDValidator('postId', postId)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateContent = function(content) {
    const validator = new StringValidator('content', content)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(5000)
        .getErrors()
    return errors
}

const validateSiteModerationId = function(value, existing, action) {
    const validator = new UUIDValidator('siteModerationId', value, existing, action)
    const errors = validator
        .mustNotBeSet()
        .getErrors()
    return errors
}

const validateGroupModerationId = function(value, existing, action) {
    const validator = new UUIDValidator('groupModerationId', value, existing, action)
    const errors = validator
        .mustNotBeSet()
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
 * Validate a user-created PostComment entity.
 *
 * @param {PostComment} postComment The PostComment entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(postComment) {
    let validators = {
        userId: validateUserId,
        postId: validatePostId,
        content: validateContent,
        groupModerationId: validateGroupModerationId,
        siteModerationId: validateSiteModerationId,
        createDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(postComment, validators)
}

module.exports = {
    validateUserId: validateUserId,
    validatePostId: validatePostId,
    validateContent: validateContent,
    validateGroupModerationId: validateGroupModerationId,
    validateSiteModerationId: validateSiteModerationId,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    validate: validate
}
