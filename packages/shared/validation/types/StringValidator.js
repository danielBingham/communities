module.exports = class StringValidator {

    constructor(name, value) {
        this.name = name
        this.value = value

        this.errors = []
    }

    shortCircuit() {
        return this.value === undefined
            || this.value === null
            || typeof this.value !== "string"
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

    mustBeString() {
        if ( this.value === undefined || this.value === null ) {
            return this
        }

        if ( typeof this.value !== "string" ) {
            this.errors.push({
                type: `${this.name}:invalid-type`,
                log: `${typeof this.value} is not a valid type for '${this.name}'. Must be string.`,
                message: `${typeof this.value} is not a valid type for '${this.name}'. Must be string.`
            })
        }
        return this
    }

    mustNotBeEmpty() {
        if ( this.shortCircuit() ) {
            return this
        }

        if ( this.value === '') 
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
                log: `${this.value.length} characters is too long. Must be less than ${length} characters.`,
                message: `${this.value.length} characters is too long. Must be less than ${length} characters.`
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
                log: `${this.value.length} characters is too short. Must be longer than ${length} characters.`,
                message: `${this.value.length} characters is too short . Must be longer than ${length} characters.`
            })
        }
        return this

    }

    mustMatch(regex, message) {
        if ( this.shortCircuit() ) {
            return this
        }

        if ( this.value.match(regex) === null ) {
            this.errors.push({
                type: `${this.name}:invalid`,
                log: `${this.value} is not valid. ${message}`,
                message: `${this.value} is not valid. ${message}`
            })
        }
        return this
    }

    mustBeOneOf(validValues) {
        if ( this.shortCircuit() ) {
            return this
        }

        if ( ! validValues.includes(this.value) ) {
            this.errors.push({
                type: `${this.name}:invalid`,
                log: `${this.value} is not a valid ${this.name}. Must be one of ${validValues.join(', ')}`,
                message: `${this.value} is not a valid ${this.name}. Must be one of ${validValues.join(', ')}`
            })
        }
        return this
    }
}

