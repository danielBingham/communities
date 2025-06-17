const uuidCleaner = function(value) {
    if ( typeof value !== 'string' ) {
        return value
    }

    return value.trim()
}

module.exports = {
    uuidCleaner: uuidCleaner 
}
