const BaseValidator = require('./BaseValidator')

module.exports = class ArrayValidator extends BaseValidator {

    constructor(name, value, existing, isUpdate) {
        super(name, value, existing, isUpdate)
    }

    shortCircuit() {
        return super.shortCircuit() || ! Array.isArray(this.value)
    }

    mustBeArray() {
        if ( this.value === undefined || this.value === null ) {
            return this
        }

        if ( ! Array.isArray(this.value) ) {
            this.errors.push({
                type: `${this.name}:invalid-type`,
                log: `${typeof this.value} is not a valid type for '${this.name}'. Must be an array.`,
                message: `${typeof this.value} is not a valid type for '${this.name}'. Must be an array.`
            })
        }
        return this
    }

    mustNotBeEmpty() {
        if ( this.shortCircuit() ) {
            return this
        }

        if ( this.value.length <= 0 ) 
        {
            this.errors.push({
                type: `${this.name}:required`,
                log: `${this.name} is required.`,
                message: `${this.name} is required.`
            })
        }
        return this
    }

    mustBeShorterThan(length) {
        if ( this.shortCircuit() ) {
            return this
        }

        if ( this.value.length >= length ) 
        {
            this.errors.push({
                type: `${this.name}:too-long`,
                log: `${this.value.length} is too long. Must be less than ${length}.`,
                message: `Must be less than ${length}.`
            })
        }
        return this
    }

    mustBeLongerThan(length) {
        if ( this.shortCircuit() ) {
            return this
        }

        if ( this.value.length <= length ) 
        {
            this.errors.push({
                type: `${this.name}:too-short`,
                log: `${this.value.length} is too short. Must be longer than ${length}.`,
                message: `Must be longer than ${length}.`
            })
        }
        return this
    }

    mustContainStrings() {
        if ( this.shortCircuit() ) {
            return this
        }

        for(const item of this.value) {
            if ( typeof item !== "string" ) {
                this.errors.push({
                    type: `${this.name}:invalid-type`,
                    log: `${this.name} must contain strings.  ${item} is not a string.`,
                    message: `${this.name} must contain strings.  ${item} is not a string.`
                })
            }
        }
        return this
    }

    mustContainNumbers() {
        if ( this.shortCircuit() ) {
            return this
        }

        for(const item of this.value) {
            if ( typeof item !== "number" ) {
                this.errors.push({
                    type: `${this.name}:invalid-type`,
                    log: `${this.name} must contain numbers.  ${item} is not a number.`,
                    message: `${this.name} must contain numbers.  ${item} is not a number.`
                })
            }
        }
        return this

    }

}

