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

const validatePostId = function(postId, existing, action) {
    const validator = new UUIDValidator('postId', postId, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .mustNotBeUpdated()
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateReaction = function(reaction, existing, action) {
    const validator = new StringValidator('reaction', reaction, existing, action)
    const errors = validator
        .isRequiredToCreate()
        .isRequiredToUpdate()
        .mustNotBeNull()
        .mustBeString()
        .mustBeOneOf([ 'like', 'dislike', 'block' ])
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

const clean = function(reaction) {
    const cleaners = {
        id: null,
        userId: null,
        postId: null,
        reaction: null,
        createdDate: null,
        updatedDate: null
    }
    return cleanEntity(reaction, cleaners)
}

/**
 * Validate a user-created PostReaction entity.
 *
 * @param {PostReaction} postReaction The PostReaction entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(postReaction, existing) {
    let validators = {
        id: validateId,
        userId: validateUserId,
        postId: validatePostId,
        reaction: validateReaction,
        createdDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(postReaction, validators, existing)
}

module.exports = {
    validateId: validateId,
    validateUserId: validateUserId,
    validatePostId: validatePostId,
    validateReaction: validateReaction,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    clean: clean,
    validate: validate
}
