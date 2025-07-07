const { stringCleaner } = require('./string')
const { urlCleaner } = require('./url')
const { uuidCleaner } = require('./uuid')
const { intCleaner } = require('./int')

module.exports = {
    stringCleaner: stringCleaner,
    intCleaner: intCleaner,
    urlCleaner: urlCleaner,
    uuidCleaner: uuidCleaner
}
