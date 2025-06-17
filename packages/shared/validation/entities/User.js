const { UUIDValidator, StringValidator, DateValidator } = require('../types')
const { validateEntity, cleanEntity } = require('../validate')

const validateId = function(id, existing, action) {
    const validator = new UUIDValidator('id', id, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateName = function(name, existing, action) {
    const validator = new StringValidator('name', name, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeShorterThan(512)
        .getErrors()
    return errors
}

const validateUsername = function(username, existing, action) {
    const validator = new StringValidator('username', username, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeShorterThan(512)
        .mustMatch(/^[a-zA-Z0-9\.\-_]+$/)
        .getErrors()
    return errors
}

const validateEmail = function(email, existing, action) {
    const validator = new StringValidator('email', email, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeShorterThan(512)
        .mustMatch(/^\S+@\S+$/)
        .getErrors()
    return errors
}

const validatePassword = function(password, existing, action) {
    const validator = new StringValidator('password', password, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeLongerThan(11)
        .mustBeShorterThan(257)
        .getErrors()
    return errors
}

const validateStatus = function(status, existing, action) {
    const validator = new StringValidator('status', status, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeOneOf([ 'invited', 'unconfirmed', 'confirmed', 'banned' ])
        .getErrors()
    return errors
}

const validateSiteRole = function(siteRole, existing, action) {
    const validator = new StringValidator('siteRole', siteRole, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustNotBeEmpty()
        .mustBeOneOf([ 'user', 'moderator', 'admin', 'superadmin' ])
        .getErrors()
    return errors
}

const validateAbout = function(about, existing, action) {
    const validator = new StringValidator('about', about, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(250)
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
 * Validate a user-created UserRelationship entity.
 *
 * @param {UserRelationship} userRelationship The UserRelationship entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(user, existing) {
    let validators = {
        id: validateId,
        name: validateName,
        username: validateUsername,
        email: validateEmail,
        password: validatePassword,
        status: validateStatus,
        siteRole: validateSiteRole,
        about: validateAbout,
        createdDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(user, validators, existing)
}

module.exports = {
    validateId: validateId,
    validateName: validateName,
    validateUsername: validateUsername,
    validateEmail: validateEmail,
    validatePassword: validatePassword,
    validateStatus: validateStatus,
    validateSiteRole: validateSiteRole,
    validateAbout: validateAbout,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    validate: validate
}
