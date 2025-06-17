const BaseValidator = require('./BaseValidator')

module.exports = class UrlValidator extends BaseValidator {
    constructor(name, value, existing, isUpdate) {
        super(name, value, existing, isUpdate)
    }

    mustBeURL() {
        if ( this.shortCircuit() ) {
            return this
        }

        try {
            const url = new URL(this.value)
        } catch ( error ) {
            this.errors.push({
                type: `${this.name}:invalid`,
                log: `${this.name} must be valid URL.  '${this.value}' is not valid.`,
                message: `${this.name} must be a valid URL.`
            })
        }
        return this
    }
}
