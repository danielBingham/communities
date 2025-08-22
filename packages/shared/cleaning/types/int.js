const intCleaner = function(value) {
    if ( typeof value === 'number' ) {
        return Math.floor(value)
    } else if ( typeof value === 'string' ) {
        return Number.parseInt(value.trim())
    } else {
        return undefined 
    }
}

module.exports = {
    intCleaner: intCleaner 
}
