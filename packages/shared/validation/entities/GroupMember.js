const { UUIDValidator, StringValidator } = require('../types')
const { validateEntity } = require('../validate')

const validateGroupId = function(groupId) {
    const validator = new UUIDValidator('groupId', groupId)
    const errors = validator
        .mustNotBeNull()
        .mustBeUUID()
        .getErrors()
    return errors
}

const validateUserId = function(userId) {
    const validator = new UUIDValidator('userId', userId)
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
        .mustBeOneOf([ 'pending-invited', 'pending-requested', 'member' ])
        .getErrors()
    return errors
}

const validateRole = function(role) {
    const validator = new StringValidator('role', role)
    const errors = validator
        .mustNotBeNull()
        .mustBeString()
        .mustBeOneOf([ 'member', 'moderator', 'admin' ])
        .getErrors()
    return errors
}

/**
 * Validate a user-created GroupMember entity.
 *
 * @param {GroupMember} groupMember The GroupMember entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(groupMember) {
    let validators = {
        groupId: validateGroupId,
        userId: validateUserId,
        status: validateStatus,
        role: validateRole
    }

    return validateEntity(groupMember, validators)
}

module.exports = {
    validateGroupId: validateGroupId,
    validateUserId: validateUserId,
    validateStatus: validateStatus,
    validateRole: validateRole,
    validate: validate
}
