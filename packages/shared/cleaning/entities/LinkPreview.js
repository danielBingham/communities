const { urlCleaner } = require('../types/url')
const { stringCleaner } = require('../types/string')
const { cleanEntity } = require('../clean')

const clean = function(linkPreview) {
    const cleaners = {
        id: stringCleaner,
        url: urlCleaner,
        title: stringCleaner,
        type: stringCleaner,
        siteName: stringCleaner,
        description: stringCleaner,
        imageUrl: urlCleaner,
        createdDate: null,
        updatedDate: null 
    }
    return cleanEntity(linkPreview, cleaners)
}

module.exports = {
    cleanId: stringCleaner,
    cleanUrl: urlCleaner,
    cleanTitle: stringCleaner,
    cleanType: stringCleaner,
    cleanSiteName: stringCleaner,
    cleanDescription: stringCleaner,
    cleanImageUrl: urlCleaner,
    clean: clean
}
