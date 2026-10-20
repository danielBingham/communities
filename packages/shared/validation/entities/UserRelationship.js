/******************************************************************************
 * @deprecated Entity validation in `packages/shared/validation` is deprecated
 * in favor of the Schema classes in `packages/shared/schema`.  Don't add to
 * this file.  When this entity's validation needs to change, move it to a
 * Schema instead.  See packages/shared/validation/README.md.
 ******************************************************************************/
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

const validateRelationId = function(relationId) {
    const validator = new UUIDValidator('relationId', relationId)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateStatus = function(status) {
    const validator = new StringValidator('status', status)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeOneOf([ 'pending', 'confirmed', 'blocked' ])
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
const validate = function(userRelationship) {
    let validators = {
        userId: validateUserId,
        relationId: validateRelationId,
        status: validateStatus
    }

    return validateEntity(userRelationship, validators)
}

module.exports = {
    validateUserId: validateUserId,
    validateRelationId: validateRelationId,
    validateStatus: validateStatus,
    validate: validate
}
