const uuid = require('uuid')

const validateUUID = function(name, value) {
    const errors = []

     if ( value !== null ) {
        if ( typeof value !== 'string' ) {
            errors.push({
                type: `${name}:invalid-type`,
                log: `'${typeof value}' is not a valid type for ${name}.`,
                message: `${typeof value} is not a valid type for ${name}.`
            })
        } else if ( ! uuid.validate(value) ) {
            errors.push({
                type: `${name}:invalid`,
                log: `${name} must be a valid uuid. '${value}' is not a valid uuid.`,
                message: `${name} must be a valid uuid. '${value}' is not a valid uuid.`
            })
        }
    }
    
    return errors
}

module.exports = {
    validateUUID: validateUUID
}
