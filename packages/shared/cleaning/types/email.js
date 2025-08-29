const cleanEmail = function(value) {
    if ( typeof value !== string ) {
        return value
    }

    return value.trim().toLowerCase()
}

module.exports = cleanEmail
