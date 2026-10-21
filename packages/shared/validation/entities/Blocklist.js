/******************************************************************************
 * @deprecated Entity validation in `packages/shared/validation` is deprecated
 * in favor of the Schema classes in `packages/shared/schema`.  Don't add to
 * this file.  When this entity's validation needs to change, move it to a
 * Schema instead.  See packages/shared/validation/README.md.
 ******************************************************************************/
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
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateDomain = function(domain, existing, action) {
    const validator = new StringValidator('domain', domain, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeShorterThan(255)
        .getErrors()
    return errors
}

const validateNotes = function(notes, existing, action) {
    const validator = new StringValidator('notes', notes, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(2048)
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
 * Validate a user-created Blocklist entity.
 *
 * @param {Blocklist} blocklist The Blocklist entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(blocklist, existing) {
    const validators = {
        id: validateId,
        userId: validateUserId,
        domain: validateDomain,
        notes: validateNotes,
        createdDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(blocklist, validators, existing)
}

module.exports = {
    validateId: validateId,
    validateDomain: validateDomain,
    validateNotes: validateNotes,
    validateUserId: validateUserId,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    validate: validate
}
