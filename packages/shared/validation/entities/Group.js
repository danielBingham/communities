const { UUIDValidator, StringValidator, DateValidator, ObjectValidator} = require('../types')
const { validateEntity } = require('../validate')

const validateId = function(id, existing, action) {
    const validator = new UUIDValidator('id', id, existing, action)
    const errors = validator
        .mustNotBeNull()
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
        .mustBeOneOf(['open', 'private', 'hidden'])
        .getErrors()
    return errors
}

const validatePostPermissions = function(value, existing, action) {
    const validator = new StringValidator('postPermissions', value, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeNull()
        .mustBeString()
        .mustBeOneOf(['anyone', 'members', 'approval', 'restricted'])
        .getErrors()
    return errors
}

const validateTitle = function(value, existing, action) {
    const validator = new StringValidator('title', value, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeShorterThan(512)
        .getErrors()
            
    return errors
}

const validateSlug = function(value, existing, action) {
    const validator = new StringValidator('slug', value, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeShorterThan(512)
        .mustMatch(/^[a-zA-Z0-9\.\-_]+$/, `May only include letters, numbers, '.', '-', '_'.`)
        .getErrors()
    return errors
}

const validateAbout = function(value, existing, action) {
    const validator = new StringValidator('about', value, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(10000)
        .getErrors()
    return errors
}

const validateFileId = function(fileId, existing, action) {
    const validator = new UUIDValidator('fileId', fileId, existing, action)

    // fileId may be null.
    const errors = validator
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateEntranceQuestions = function(value, existing, action) {
    const validator = new ObjectValidator('entranceQuestions', value, existing, action)
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
 * Validate a user-created Group entity.
 *
 * @param {Group} group The Group entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(group, existing) {
    let validators = {
        id: validateId,
        type: validateType,
        postPermissions: validatePostPermissions,
        title: validateTitle,
        slug: validateSlug,
        about: validateAbout,
        fileId: validateFileId,
        entranceQuestions: validateEntranceQuestions,
        createdDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(group, validators, existing)
}

module.exports = {
    validateId: validateId,
    validateType: validateType,
    validatePostPermissions: validatePostPermissions,
    validateTitle: validateTitle,
    validateSlug: validateSlug,
    validateAbout: validateAbout,
    validateFileId: validateFileId,
    validateEntranceQuestions: validateEntranceQuestions,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    validate: validate
}
