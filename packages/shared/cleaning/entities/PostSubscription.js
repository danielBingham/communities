const { cleanUuid } = require('../types/uuid')
const { cleanEntity } = require('../clean')

const clean = function(postSubscription) {
    const cleaners = {
        id: cleanUuid,
        userId: cleanUuid,
        postId: cleanUuid,
        createdDate: null,
        updatedDate: null 
    }
    return cleanEntity(postSubscription, cleaners)
}

module.exports = {
    cleanId: cleanUuid,
    cleanUserId: cleanUuid,
    cleanPostId: cleanUuid,
    clean: clean
}
