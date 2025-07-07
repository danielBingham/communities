const BaseValidator = require('./BaseValidator')

module.exports = class ObjectValidator extends BaseValidator {
    constructor(name, value, existing, isUpdate) {
        super(name, value, existing, isUpdate)
    }
}
