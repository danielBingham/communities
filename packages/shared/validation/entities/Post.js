const { StringValidator, NumberValidator, UUIDValidator, DateValidator } = require('../types')
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

const validateGroupId = function(groupId, existing, action) {
    const validator = new UUIDValidator('groupId', groupId, existing, action)
    const errors = validator
        .mustNotBeUpdated()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateType = function(value, existing, action) {
    const validator = new StringValidator('type', value, existing, action) 
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeOneOf([ 'feed', 'group', 'announcement', 'info' ])
        .getErrors()
    return errors
}

const validateVisibility = function(value, existing, action) {
    const validator = new StringValidator('visibility', value, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeOneOf([ 'public', 'private' ])
        .getErrors()
    return errors
}

const validateFileId = function(value, existing, action) {
    const validator = new UUIDValidator('fileId', value, existing, action)
    const errors = validator
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateLinkPreviewId = function(value, existing, action) {
    const validator = new UUIDValidator('linkPreviewId', value, existing, action)
    const errors = validator
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateSharedPostId = function(value, existing, action) {
    const validator = new UUIDValidator('sharedPostId', value, existing, action)
    const errors = validator
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateSiteModerationId = function(value, existing, action) {
    const validator = new UUIDValidator('siteModerationId', value, existing, action)
    const errors = validator
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateGroupModerationId = function(value, existing, action) {
    const validator = new UUIDValidator('groupModerationId', value, existing, action)
    const errors = validator
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateActivity = function(value, existing, action) {
    const validator = new NumberValidator('activity', value, existing, action)
    const errors = validator
        .mustNotBeSet()
        .getErrors()
    return errors
}

const validateContent = function(value, existing, action) {
    const validator = new StringValidator('content', value, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(10001)
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
 * Validate a user-created Post entity.
 *
 * @param {Post} post The Post entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(post, existing) {
    const validators = {
        id: validateId,
        userId: validateUserId,
        groupId: validateGroupId,
        type: validateType,
        visibility: validateVisibility,
        fileId: validateFileId,
        linkPreviewId: validateLinkPreviewId,
        sharedPostId: validateSharedPostId,
        siteModerationId: validateSiteModerationId,
        groupModerationId: validateGroupModerationId,
        activity: validateActivity,
        content: validateContent,
        createdDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(post, validators, existing)
}

module.exports = {
    validateId: validateId,
    validateUserId: validateUserId,
    validateGroupId: validateGroupId,
    validateType: validateType,
    validateVisibility: validateVisibility,
    validateFileId: validateFileId,
    validateLinkPreviewId: validateLinkPreviewId,
    validateSharedPostId: validateSharedPostId,
    validateSiteModerationId: validateSiteModerationId,
    validateGroupModerationId: validateGroupModerationId,
    validateActivity: validateActivity,
    validateContent: validateContent,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    validate: validate
}
