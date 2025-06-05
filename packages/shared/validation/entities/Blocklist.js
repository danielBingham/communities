const { validateUUID } = require('../types')
const { objectHas } = require('../../util')

const validateUserId = function(userId) {
    const errors = []

    if ( userId === null ) {
        errors.push({
            type: `userId:null`,
            log: `userId may not be null.`,
            message: `userId may not be null.`
        })
    } else {
        const uuidErrors = validateUUID('userId', userId)
        if ( uuidErrors.length > 0 ) {
            errors.push(...uuidErrors)
        }
    }

    return errors
}

const validateDomain = function(domain) {
    const errors = []

    if ( domain === null ) {
        errors.push({
            type: `domain:null`,
            log: `domain may not be null.`,
            message: `domain may not be null.`
        })
    } else if ( typeof domain !== 'string' ) {
        errors.push({
            type: `domain:invalid-type`,
            log: `'${typeof domain}' is not a valid type for domain.`,
            message: `'${typeof domain}' is not a valid type for domain.`
        })
    } else {
        if ( domain.length > 255 ) {
            errors.push({
                type: `domain:too-long`,
                log: `Domain names may not be longer than 255 characters.`,
                message: `Domain names may not be longer than 255 characters.`
            })
        }
    }

    return errors
}

const validateNotes = function(notes) {
    const errors = []

    if ( notes === null ) {
        errors.push({
            type: `notes:null`,
            log: `notes may not be null.`,
            message: `notes may not be null.`
        })
    } else if ( typeof notes !== 'string' ) {
        errors.push({
            type: `notes:invalid-type`,
            log: `'${typeof notes}' is not a valid type of notes.`,
            message: `'${typeof notes}' is not valid type for notes.`
        })
    } else {
        if ( notes.length > 2048 ) {
            errors.push({
                type: `notes:too-long`,
                log: `notes may not be longer than 2048 characters.`,
                message: `notes may not be longer than 2048 characters.`
            })
        }
    }

    return errors
}



/**
 * Validate a user-created Blocklist entity.
 *
 * @param {Blocklist} blocklist The Blocklist entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(blocklist) {
    const errors = {
        all: []
    }
    let fieldsToValidate = ['userId', 'domain', 'notes']

    for(const field of fieldsToValidate) {
        // Creation and Updating have different requried and disallowed fields,
        // and we're not sure which we're doing here.  We're going to punt that
        // validation for now.
        //
        // TODO We could probably solve this with a parameter, but I want to
        // see what this looks like on the frontend before trying that.
        if ( ! objectHas(blocklist, field) ) {
            continue
        }

        if ( field === 'userId') {
            errors.userId = validateUserId(blocklist.userId)
            if ( errors.userId.length > 0 ) {
                errors.all.push(...errors.userId)
            }
        } else if ( field === 'domain' ) {
            errors.domain = validateDomain(blocklist.domain)
            if ( errors.domain.length > 0 ) {
                errors.all.push(...errors.domain)
            }
        } else if ( field === 'notes' ) {
            errors.notes = validateNotes(blocklist.notes)
            if ( errors.notes.length > 0 ) {
                errors.all.push(...errors.notes)
            }
        }
    }

    return errors
}

module.exports = {
    validateDomain: validateDomain,
    validateNotes: validateNotes,
    validateUserId: validateUserId,
    validate: validate
}
