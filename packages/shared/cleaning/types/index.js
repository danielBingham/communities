const { intCleaner } = require('./int')
const cleanNumber = require('./number')
const cleanBoolean = require('./boolean')
const { stringCleaner } = require('./string')
const { urlCleaner } = require('./url')
const { uuidCleaner } = require('./uuid')

module.exports = {
    intCleaner: intCleaner,
    cleanNumber: cleanNumber,
    cleanBoolean: cleanBoolean,
    stringCleaner: stringCleaner,
    urlCleaner: urlCleaner,
    uuidCleaner: uuidCleaner
}
