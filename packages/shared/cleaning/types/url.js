const urlCleaner = function(value) {
    if ( typeof value !== 'string' ) {
        return value
    }

    return value.trim()
}

module.exports = {
    urlCleaner: urlCleaner 
}
