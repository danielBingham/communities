
const cleanEntity = function(entity, cleaners) {
    const cleanedEntity = {}
    for( const [property, cleaner] of Object.entries(cleaners)) {
        if ( ! (property in entity) || entity[property] === undefined ) {
            continue
        }

        if ( cleaner !== null && typeof cleaner === 'function' ) {
            cleanedEntity[property] = cleaner(entity[property])
        } else {
            cleanedEntity[property] = entity[property]
        }
    }
    return cleanedEntity
}

module.exports = {
    cleanEntity: cleanEntity
}
