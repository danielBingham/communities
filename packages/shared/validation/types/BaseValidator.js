module.exports = class BaseValidator {

    constructor(name, value, existing) {
        this.name = name
        this.value = value
        this.existing = existing

        this.errors = []
    }

    shortCircuit() {
        return this.value === undefined
            || this.value === null
    }

    getErrors() {
        return this.errors
    }

    isRequiredToCreate() {
        if ( this.value === undefined && this.existing === undefined ) {
            this.errors.push({
                type: `${this.name}:required`,
                log: `${this.name} is required.`,
                message: `${this.name} is requried.`
            })
        }
        return this

    }

    isRequiredToUpdate() {
        if ( this.value === undefined && this.existing !== undefined ) {
            this.errors.push({
                type: `${this.name}:required`,
                log: `${this.name} is required.`,
                message: `${this.name} is requried.`
            })
        }
        return this
    }

    mustNotBeUpdated() {
        if ( this.value !== undefined && this.existing !== undefined && this.value !== this.existing ) {
            this.errors.push({
                type: `${this.name}:not-allowed`,
                log: `${this.name} may not be updated.`,
                message: `${this.name} may not be updated.`
            })
        }
        return this

    }

    mustNotBeSet() {
        if ( this.value !== undefined ) {
            this.errors.push({
                type: `${this.name}:not-allowed`,
                log: `${this.name} is not allowed.`,
                message: `You may not set '${this.name}'.`
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
}

