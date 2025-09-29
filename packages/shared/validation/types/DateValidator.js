const BaseValidator = require('./BaseValidator')

module.exports = class DateValidator extends BaseValidator {
    constructor(name, value, existing, isUpdate) {
        super(name, value, existing, isUpdate)
    }

    shortCircuit() {
        return super.shortCircuit() || typeof this.value !== "string"
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

    mustBeValidDate()   {
        if ( this.shortCircuit() || this.value === '') {
            return
        }

        const parts = this.value.split('-')
        const date = new Date(parts[0], parts[1], parts[2])

        if ( date.getFullYear() !== parts[0] || date.getMonth() !== parts[1] || date.getDate() !== parts[2] ) {
            this.errors.push({
                type: `${this.name}:invalid`,
                log: `${this.name} must be a valid date.`,
                message: `${this.name} must be a valid date of the format 'YYYY-MM-DD'.`
            })
        }

        return this
    }
}
