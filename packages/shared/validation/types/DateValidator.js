const BaseValidator = require('./BaseValidator')

module.exports = class DateValidator extends BaseValidator {
    constructor(name, value, existing, isUpdate) {
        super(name, value, existing, isUpdate)
    }

}
