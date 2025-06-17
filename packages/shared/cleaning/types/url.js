const urlCleaner = function(value) {
    if ( typeof value !== 'string' ) {
        return value
    }

    return value.toLowerCase().trim()
}

module.exports = {
    urlCleaner: urlCleaner 
}
