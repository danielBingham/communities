const { UUIDValidator, StringValidator, UrlValidator, DateValidator } = require('../types')
const { validateEntity } = require('../validate')

const validateId = function(id, existing, action) {
    const validator = new UUIDValidator('id', id, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateUrl = function(url, existing, action) {
    const validator = new UrlValidator('url', url, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustNotBeEmpty()
        .mustBeString()
        .mustBeURL()
        .getErrors()
    return errors
}

const validateTitle = function(title, existing, action) {
    const validator = new StringValidator('title', title, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(512)
        .getErrors()
    return errors
}

const validateType = function(type, existing, action) {
    const validator = new StringValidator('type', type, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(512)
        .getErrors()
    return errors
}

const validateSiteName = function(siteName, existing, action) {
    const validator = new StringValidator('siteName', siteName, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(512)
        .getErrors()
    return errors
}

const validateDescription = function(description, existing, action) {
    const validator = new StringValidator('description', description, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(2048)
        .getErrors()
    return errors
}

const validateImageUrl = function(imageUrl, existing, action) {
    const validator = new UrlValidator('imageUrl', imageUrl, existing, action)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeURL()
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
 * Validate a user-created LinkPreview entity.
 *
 * @param {LinkPreview} linkPreview The LinkPreview entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(linkPreview, existing) {
    let validators = {
        id: validateId,
        url: validateUrl,
        title: validateTitle,
        type: validateType,
        siteName: validateSiteName,
        description: validateDescription,
        imageUrl: validateImageUrl,
        createdDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(linkPreview, validators, existing)
}

module.exports = {
    validateId: validateId,
    validateUrl: validateUrl,
    validateTitle: validateTitle,
    validateType: validateType,
    validateSiteName: validateSiteName,
    validateDescription: validateDescription,
    validateImageUrl: validateImageUrl,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    validate: validate
}
