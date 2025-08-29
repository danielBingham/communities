const { stringCleaner } = require('../types/string')
const { cleanUuid } = require('../types/uuid')
const { cleanEntity } = require('../clean')

const clean = function(groupModeration) {
    const cleaners = {
        id: cleanUuid,
        userId: cleanUuid,
        groupId: cleanUuid,
        status: stringCleaner,
        reason: stringCleaner,
        postId: cleanUuid,
        postCommentId: cleanUuid,
        createdDate: null,
        updatedDate: null 
    }
    return cleanEntity(groupModeration, cleaners)
}

module.exports = {
    cleanId: cleanUuid,
    cleanUserId: cleanUuid,
    cleanGroupId: cleanUuid,
    cleanStatus: stringCleaner,
    cleanReason: stringCleaner,
    cleanPostId: cleanUuid,
    cleanPostCommentId: cleanUuid,
    clean: clean
}
