const { intCleaner } = require('./int')
const cleanNumber = require('./number')
const cleanBoolean = require('./boolean')
const { stringCleaner } = require('./string')
const { urlCleaner } = require('./url')
const { cleanUuid } = require('./uuid')
const cleanEmail = require('./email')

module.exports = {
    intCleaner: intCleaner,
    cleanNumber: cleanNumber,
    cleanBoolean: cleanBoolean,
    stringCleaner: stringCleaner,
    urlCleaner: urlCleaner,
    cleanUuid: cleanUuid,
    cleanEmail: cleanEmail
}
