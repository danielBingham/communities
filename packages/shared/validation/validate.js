const { objectHas } = require('../util')

const validateEntity = function(entity, validators) {
    const errors = {
        all: []
    }

    for(const [property, validator] of Object.entries(validators)) {
        // Creation and Updating have different requried and disallowed fields,
        // and we're not sure which we're doing here.  We're going to punt that
        // validation for now.
        //
        // TODO We could probably solve this with a parameter, but I want to
        // see what this looks like on the frontend before trying that.
        if ( ! objectHas(entity, property) ) {
            continue
        }

        errors[property] = validator(entity[property])
        if ( errors[property].length > 0 ) {
            errors.all.push(...errors[property])
        }
    }

    return errors
}

module.exports = {
    validateEntity: validateEntity
}
