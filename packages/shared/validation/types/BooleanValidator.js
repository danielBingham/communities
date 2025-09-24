const BaseValidator = require('./BaseValidator')

module.exports = class BooleanValidator extends BaseValidator {
    constructor(name, value, existing, isUpdate) {
        super(name, value, existing, isUpdate)
    }

    shortCircuit() {
        return super.shortCircuit() || typeof this.value !== "boolean"
    }

    mustBeBoolean() {
        if ( this.value === undefined || this.value === null ) {
            return this
        }

        if ( typeof this.value !== "boolean" ) {
            this.errors.push({
                type: `${this.name}:invalid-type`,
                log: `${typeof this.value} is not a valid type for '${this.name}'. Must be a boolean.`,
                message: `${typeof this.value} is not a valid type for '${this.name}'. Must be a boolean.`
            })
        }
        return this
    }
}
