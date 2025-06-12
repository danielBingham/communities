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

const validateReaction = function(reaction) {
    const validator = new StringValidator('reaction', reaction)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeOneOf([ 'like', 'dislike', 'block' ])
        .getErrors()
    return errors
}

/**
 * Validate a user-created PostComment entity.
 *
 * @param {PostComment} postReaction The PostComment entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(postReaction) {
    let validators = {
        userId: validateUserId,
        postId: validatePostId,
        reaction: validateReaction
    }

    return validateEntity(postReaction, validators)
}

module.exports = {
    validateUserId: validateUserId,
    validatePostId: validatePostId,
    validateReaction: validateReaction,
    validate: validate
}
