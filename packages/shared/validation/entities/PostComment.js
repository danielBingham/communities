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

const validateContent = function(content) {
    const validator = new StringValidator('content', content)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeShorterThan(5000)
        .getErrors()
    return errors
}

/**
 * Validate a user-created PostComment entity.
 *
 * @param {PostComment} postComment The PostComment entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(postComment) {
    let validators = {
        userId: validateUserId,
        postId: validatePostId,
        content: validateContent
    }

    return validateEntity(postComment, validators)
}

module.exports = {
    validateUserId: validateUserId,
    validatePostId: validatePostId,
    validateContent: validateContent,
    validate: validate
}
