const BaseValidator = require('./types/BaseValidator')

const validateEntity = function(entity, validators, existing) {
    const errors = {
        all: []
    }

    const action = existing !== undefined && existing !== null ? BaseValidator.ACTIONS.UPDATE : BaseValidator.ACTIONS.CREATE

    for(const [property, validator] of Object.entries(validators)) {
        errors[property] = validator(entity[property], existing ? existing[property] : undefined, action)
        if ( errors[property].length > 0 ) {
            errors.all.push(...errors[property])
        }
    }

    return errors
}

module.exports = {
    validateEntity: validateEntity
}
