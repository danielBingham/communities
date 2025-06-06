const { validateUUID } = require('../types')
const { objectHas } = require('../../util')

const validateType = function(type) {
    const errors = []
    if ( type === null ) {
        errors.push({
            type: `type:null`,
            log: `type may not be null.`,
            message: `type may not be null.`
        })
    } else if ( typeof type !== 'string' ) {
        errors.push({
            type: `type:invalid-type`,
            log: `${typeof type} is not a valid type for 'type'.`,
            message: `${typeof type} is not a valid type for 'type'.`
        })
    } else {
        const validTypes = [ 'open', 'private', 'hidden' ]
        if ( ! validTypes.includes(type) ) {
            errors.push({
                type: `type:invalid`,
                log: `${type} is not a valid type.`,
                message: `${type} is not a valid type.`
            })
        }
    }
    return errors
}

const validateTitle = function(title) {
    const errors = []
    if ( title === null ) {
        errors.push({
            type: `title:null`,
            log: `title may not be null.`,
            message: `title may not be null.`
        })
    } else if ( typeof title !== 'string' ) {
        errors.push({
            type: `title:invalid-type`,
            log: `${typeof type} is not a valid type for 'title'. Title must be a string.`,
            message: `${typeof type} is not a valid type for 'title'. Title must be a sting.`
        })
    } else {
        if ( title.length <= 0 ) {
            errors.push({
                type: `title:required`,
                log: `Title is required.`,
                message: `Title is required.`
            })
        }

        if ( title.length > 512) {
            errors.push({
                type: `title:too-long`,
                log: `${title.length} characters is too long. Title must be 512 characters or less.`,
                message: `${title.length} characters is too long.  Title must be 512 characters or less.`
            })
        }
    }
    return errors
}

const validateSlug = function(slug) {
    const errors = []
    if ( slug === null ) {
        errors.push({
            type: `slug:null`,
            log: `Slug may not be null.`,
            message: `URL may not be null.`
        })
    } else if ( typeof slug !== 'string' ) {
        errors.push({
            type: `slug:invalid-type`,
            log: `${typeof slug} is an invalid type for slug. Slug must be string.`,
            message: `${typeof slug} is an invalid type for URL. URL must be string.`
        })
    } else {
        if ( slug.length <= 0 ) {
            errors.push({
                type: `slug:required`,
                log: `Slug is required.`,
                message: `URL is required.`
            })
        } 

        if ( slug.length > 512 ) {
            errors.push({
                type: `slug:too-long`,
                log: `${slug.length} characters is too long. Slug must be 512 characters or less.`,
                message: `URL must be 512 characters or less.`
            })
        }

        if ( slug.match(/^[a-zA-Z0-9\.\-_]+$/) === null ) {
            errors.push({
                type: `slug:invalid`,
                log: `${slug} is not valid.  May only include letters, numbers, '.', '-', '_'.`,
                message: `URL may only include letters, numbers, '.', '-', and  '_'.`
            })
        }
    }
    return errors
}

const validateAbout = function(about) {
    const errors = []
    if ( about === null ) {
        errors.push({
            type: `about:null`,
            log: `About may not be null.`,
            message: `About may not be null.`
        })
    } else if ( typeof about !== 'string' ) {
        errors.push({
            type: `about:invalid-type`,
            log: `${typeof about} is an invalid type. About must be string.`,
            message: `${typeof about} is an invalid type. About must be string.`
        })
    } else {
        if ( about.length > 10000) {
            errors.push({
                type: `about:too-long`,
                log: `${about.length} characters is too long. About must be 10,000 characters or less.`,
                message: `About must be 10,000 characters or less.`
            })
        }
    }
    return errors
}

const validateFileId = function(fileId) {
    const errors = []
    // fileId may be null.
    if ( fileId !== null ) {
        const uuidErrors = validateUUID('fileId', fileId)
        if ( uuidErrors.length > 0 ) {
            errors.push(...uuidErrors)
        }
    }
    return errors
}


/**
 * Validate a user-created Group entity.
 *
 * @param {Group} group The Group entity to validate.
 *
 * @return {ValidationErrors{}} Returns an object with an array of validation
 * errors for each field.
 */
const validate = function(group) {
    const errors = {
        all: []
    }
    let fieldsToValidate = [ 'type', 'title', 'slug', 'about', 'fileId']
    let validators = {
        type: validateType,
        title: validateTitle,
        slug: validateSlug,
        about: validateAbout,
        fileId: validateFileId
    }

    for(const field of fieldsToValidate) {
        // Creation and Updating have different requried and disallowed fields,
        // and we're not sure which we're doing here.  We're going to punt that
        // validation for now.
        //
        // TODO We could probably solve this with a parameter, but I want to
        // see what this looks like on the frontend before trying that.
        if ( ! objectHas(group, field) ) {
            continue
        }

        errors[field] = validators[field](group[field])
        if ( errors[field].length > 0 ) {
            errors.all.push(...errors[field])
        }
    }

    return errors
}

module.exports = {
    validateType: validateType,
    validateTitle: validateTitle,
    validateSlug: validateSlug,
    validateAbout: validateAbout,
    validateFileId: validateFileId,
    validate: validate
}
