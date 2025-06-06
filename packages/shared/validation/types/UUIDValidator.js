const uuid = require('uuid')

module.exports = class UUIDValidator {

    constructor(name, value) {
        this.name = name
        this.value = value

        this.errors = []
    }

    shortCircuit() {
        return this.value === undefined
            || this.value === null
    }

    getErrors() {
        return this.errors
    }

    isRequired() {
        if ( this.value === undefined ) {
            this.errors.push({
                type: `${this.name}:required`,
                log: `${this.name} is required.`,
                message: `${this.name} is requried.`
            })
        }
        return this
    }

    mustNotBeNull() {
        if ( this.value === null ) {
            this.errors.push({
                type: `${this.name}:null`,
                log: `${this.name} may not be null.`,
                message: `${this.name} may not be null.`
            })
        }
        return this
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

