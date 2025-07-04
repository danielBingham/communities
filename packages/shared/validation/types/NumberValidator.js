
const BaseValidator = require('./BaseValidator')

module.exports = class NumberValidator extends BaseValidator {

    constructor(name, value, existing, isUpdate) {
        super(name, value, existing, isUpdate)
    }

    shortCircuit() {
        return super.shortCircuit() || typeof this.value !== "number"
    }

    mustBeNumber() {
        if ( this.value === undefined || this.value === null ) {
            return this
        }

        if ( typeof this.value !== "number" ) {
            this.errors.push({
                type: `${this.name}:invalid-type`,
                log: `${typeof this.value} is not a valid type for '${this.name}'. Must be a number.`,
                message: `${typeof this.value} is not a valid type for '${this.name}'. Must be a number.`
            })
        }
        return this
    }

    mustBeInteger() {
        if ( this.shortCircuit() ) {
            return this
        }

        if ( Number.isInteger(this.value) !== true ) {
            this.errors.push({
                type: `${this.name}:invalid-type`,
                log: `Must be an integer.`,
                message: `Must be an integer.`
            })
        }
        return this
    }
}

