const { UUIDValidator, StringValidator, DateValidator } = require('../types')
const { validateEntity } = require('../validate')

/**
 * The reactions a user may leave on a PostComment.  These must match the
 * `comment_reaction_type` enum in the database.
 */
const REACTIONS = [ 'like' ]

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

const validateCommentId = function(commentId, existing, action) {
    const validator = new UUIDValidator('commentId', commentId, existing, action)
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
        .mustBeOneOf(REACTIONS)
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
 * Validate a user-created CommentReaction entity.
 *
 * @param {CommentReaction} commentReaction The CommentReaction entity to validate.
 * @param {CommentReaction} [existing] The existing CommentReaction, when updating.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(commentReaction, existing) {
    let validators = {
        id: validateId,
        userId: validateUserId,
        postId: validatePostId,
        commentId: validateCommentId,
        reaction: validateReaction,
        createdDate: validateCreatedDate,
        updatedDate: validateUpdatedDate
    }

    return validateEntity(commentReaction, validators, existing)
}

module.exports = {
    REACTIONS: REACTIONS,
    validateId: validateId,
    validateUserId: validateUserId,
    validatePostId: validatePostId,
    validateCommentId: validateCommentId,
    validateReaction: validateReaction,
    validateCreatedDate: validateCreatedDate,
    validateUpdatedDate: validateUpdatedDate,
    validate: validate
}
