const { UUIDValidator, StringValidator } = require('../types')
const { validateEntity } = require('../validate')

const validateType = function(type) {
    const validator = new StringValidator('type', type)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeOneOf(['open', 'private', 'hidden'])
        .getErrors()
    return errors
}

const validateTitle = function(title) {
    const validator = new StringValidator('title', title)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeShorterThan(512)
        .getErrors()
            
    return errors
}

const validateSlug = function(slug) {
    const validator = new StringValidator('slug', slug)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeShorterThan(512)
        .mustMatch(/^[a-zA-Z0-9\.\-_]+$/, `May only include letters, numbers, '.', '-', '_'.`)
        .getErrors()
    return errors
}

const validateAbout = function(about) {
    const validator = new StringValidator('about', about)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(10000)
        .getErrors()
    return errors
}

const validateFileId = function(fileId) {
    const validator = new UUIDValidator('fileId', fileId)

    // fileId may be null.
    const errors = validator
        .mustBeUUID()
        .getErrors()
    return errors
}


/**
 * Validate a user-created Group entity.
 *
 * @param {Group} group The Group entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(group) {
    let validators = {
        type: validateType,
        title: validateTitle,
        slug: validateSlug,
        about: validateAbout,
        fileId: validateFileId
    }

    return validateEntity(group, validators)
}

module.exports = {
    validateType: validateType,
    validateTitle: validateTitle,
    validateSlug: validateSlug,
    validateAbout: validateAbout,
    validateFileId: validateFileId,
    validate: validate
}
