const { StringValidator, UUIDValidator, DateValidator } = require('../types')
const { validateEntity, cleanEntity } = require('../validate')

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

const validateDomain = function(domain, existing) {
    const validator = new StringValidator('domain', domain, existing)
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

const validateNotes = function(notes, existing) {
    const validator = new StringValidator('notes', notes, existing)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(2048)
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

const clean = function(blocklist) {
    const cleaners = {
        id: null,
        userId: null,
        domain: function(domain) {
            if ( domain !== undefined && domain !== null && typeof domain === 'string' ) {
                return domain.toLowerCase()
            }
            return domain
        },
        notes: null,
        createdDate: null,
        updatedDate: null
    }
    return cleanEntity(blocklist, cleaners)
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
    clean: clean,
    validate: validate
}
