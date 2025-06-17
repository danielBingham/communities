const { uuidCleaner } = require('../types/uuid')
const { cleanEntity } = require('../clean')

const clean = function(postSubscription) {
    const cleaners = {
        id: uuidCleaner,
        userId: uuidCleaner,
        postId: uuidCleaner,
        createdDate: null,
        updatedDate: null 
    }
    return cleanEntity(postSubscription, cleaners)
}

module.exports = {
    cleanId: uuidCleaner,
    cleanUserId: uuidCleaner,
    cleanPostId: uuidCleaner,
    clean: clean
}
