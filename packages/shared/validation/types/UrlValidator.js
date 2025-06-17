const StringValidator = require('./StringValidator')

module.exports = class UrlValidator extends StringValidator {
    constructor(name, value, existing, action) {
        super(name, value, existing, action)
    }

    mustBeURL() {
        if ( this.shortCircuit() || this.value === '') {
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
