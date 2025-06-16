const uuid = require('uuid')

const BaseValidator = require('./BaseValidator')

module.exports = class UUIDValidator extends BaseValidator {

    constructor(name, value, existing) {
        super(name, value, existing)
    }

    mustBeUUID() {
        if ( this.shortCircuit() ) {
            return this
        }

        if ( ! uuid.validate(this.value) ) {
            this.errors.push({
                type: `${this.name}:invalid`,
                log: `${this.name} must be a valid uuid. '${this.value}' is not a valid uuid.`,
                message: `${this.name} must be a valid uuid. '${this.value}' is not a valid uuid.`
            })
        }

        return this
    } 

}

