const BaseValidator = require('./types/BaseValidator')

const cleanEntity = function(entity, cleaners) {
    const cleanedEntity = {}
    for( const [property, cleaner] of Object.entries(cleaners)) {
        if ( cleaner !== null && typeof cleaner === 'function' ) {
            cleanedEntity[property] = cleaner(entity[property])
        } else {
            cleanedEntity[property] = entity[property]
        }
    }
    return cleanedEntity
}

const validateEntity = function(entity, validators, existing) {
    const errors = {
        all: []
    }

    const action = existing !== undefined && existing !== null ? BaseValidator.ACTIONS.UPDATE : BaseValidator.ACTIONS.CREATE

    console.log(action)
    for(const [property, validator] of Object.entries(validators)) {
        errors[property] = validator(entity[property], existing ? existing[property] : undefined, action)
        if ( errors[property].length > 0 ) {
            errors.all.push(...errors[property])
        }
    }

    return errors
}

module.exports = {
    cleanEntity: cleanEntity,
    validateEntity: validateEntity
}
