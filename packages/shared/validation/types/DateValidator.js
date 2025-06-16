const BaseValidator = require('./BaseValidator')

module.exports = class DateValidator extends BaseValidator {
    constructor(name, value, existing) {
        super(name, value, existing)
    }

}
