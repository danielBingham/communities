const { stringCleaner } = require('../types/string')
const { uuidCleaner } = require('../types/uuid')
const { cleanEntity } = require('../clean')

const clean = function(groupModeration) {
    const cleaners = {
        id: uuidCleaner,
        userId: uuidCleaner,
        groupId: uuidCleaner,
        status: stringCleaner,
        reason: stringCleaner,
        postId: uuidCleaner,
        postCommentId: uuidCleaner,
        createdDate: null,
        updatedDate: null 
    }
    return cleanEntity(groupModeration, cleaners)
}

module.exports = {
    cleanId: uuidCleaner,
    cleanUserId: uuidCleaner,
    cleanGroupId: uuidCleaner,
    cleanStatus: stringCleaner,
    cleanReason: stringCleaner,
    cleanPostId: uuidCleaner,
    cleanPostCommentId: uuidCleaner,
    clean: clean
}
