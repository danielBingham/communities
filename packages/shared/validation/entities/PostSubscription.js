const { UUIDValidator, StringValidator } = require('../types')
const { validateEntity } = require('../validate')

const validateUserId = function(userId) {
    const validator = new UUIDValidator('userId', userId)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validatePostId = function(postId) {
    const validator = new UUIDValidator('postId', postId)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

/**
 * Validate a user-created PostSubscription entity.
 *
 * @param {PostSubscription} postSubscription The PostSubscription entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(postSubscription) {
    let validators = {
        userId: validateUserId,
        postId: validatePostId,
    }

    return validateEntity(postSubscription, validators)
}

module.exports = {
    validateUserId: validateUserId,
    validatePostId: validatePostId,
    validate: validate
}
