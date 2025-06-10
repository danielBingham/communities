const { StringValidator, UUIDValidator } = require('../types')
const { validateEntity } = require('../validate')

const validateUserId = function(userId) {
    const validator = new UUIDValidator('userId', userId)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateDomain = function(domain) {
    const validator = new StringValidator('domain', domain)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeShorterThan(255)
        .getErrors()
    return errors
}

const validateNotes = function(notes) {
    const validator = new StringValidator('notes', notes)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(2048)
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
const validate = function(blocklist) {
    let validators = {
        userId: validateUserId,
        domain: validateDomain,
        notes: validateNotes
    }

    return validateEntity(blocklist, validators)
}

module.exports = {
    validateDomain: validateDomain,
    validateNotes: validateNotes,
    validateUserId: validateUserId,
    validate: validate
}
