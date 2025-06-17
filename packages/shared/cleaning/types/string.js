const stringCleaner = function(value) {
    if ( typeof value !== 'string' ) {
        return value
    }

    return value.trim()
}

module.exports = {
    stringCleaner: stringCleaner
}
