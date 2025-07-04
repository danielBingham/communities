const { urlCleaner } = require('../types/url')
const { stringCleaner } = require('../types/string')
const { uuidCleaner } = require('../types/uuid')
const { cleanEntity } = require('../clean')

const cleanTitle = function(value) {
    return stringCleaner(value).substring(0, 512)
}

const cleanSiteName = function(value) {
    return stringCleaner(value).substring(0, 512)
}

const cleanDescription = function(value) {
    return stringCleaner(value).substring(0, 2048)
}

const clean = function(linkPreview) {
    const cleaners = {
        id: uuidCleaner,
        url: urlCleaner,
        title: cleanTitle,
        type: stringCleaner,
        siteName: cleanSiteName,
        description: cleanDescription,
        imageUrl: urlCleaner,
        createdDate: null,
        updatedDate: null 
    }
    return cleanEntity(linkPreview, cleaners)
}

module.exports = {
    cleanId: uuidCleaner,
    cleanUrl: urlCleaner,
    cleanTitle: cleanTitle,
    cleanType: stringCleaner,
    cleanSiteName: cleanSiteName,
    cleanDescription: cleanDescription,
    cleanImageUrl: urlCleaner,
    clean: clean
}
