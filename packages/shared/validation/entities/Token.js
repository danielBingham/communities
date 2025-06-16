const { UUIDValidator, DateValidator, StringValidator } = require('../types')
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

const validateCreatorId = function(creatorId, existing) {
    const validator = new UUIDValidator('creatorId', creatorId, existing)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateToken = function(token, existing) {
    const validator = new StringValidator('token', token, existing)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .getErrors()
    return errors
}

const validateType = function(type, existing) {
    const validator = new StringValidator('type', type, existing)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeOneOf([ 'email-confirmation', 'reset-password', 'invitation'])
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

const clean = function(token) {
    const cleaners = {
        id: null,
        userId: null,
        creatorId: null,
        token: null,
        type: null,
        createdDate: null,
        updatedDate: null
    }
    return cleanEntity(token, cleaners)
}

/**
 * Validate a user-created Token entity.
 *
 * @param {Token} token The Token entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(token, existing) {
    let validators = {
        id: validateId,
        userId: validateUserId,
        creatorId: validateCreatorId,
        token: validateToken,
        type: validateType,
        createdDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(token, validators, existing)
}

module.exports = {
    validateId: validateId,
    validateUserId: validateUserId,
    validateCreatorId: validateCreatorId,
    validateToken: validateToken,
    validateType: validateType,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    clean: clean,
    validate: validate
}
