const { uuidCleaner, stringCleaner, intCleaner } = require('../types')
const { cleanEntity } = require('../clean')

const clean = function(postSubscription) {
    const cleaners = {
        id: uuidCleaner,
        userId: uuidCleaner,
        groupId: uuidCleaner,
        type: stringCleaner,
        visibility: stringCleaner,
        fileId: uuidCleaner,
        linkPreviewId: uuidCleaner,
        sharedPostId: uuidCleaner,
        siteModerationId: uuidCleaner,
        groupModerationId: uuidCleaner,
        activity: null,
        content: stringCleaner,
        createdDate: null,
        updatedDate: null 
    }
    return cleanEntity(postSubscription, cleaners)
}

module.exports = {
    cleanId: uuidCleaner,
    cleanUserId: uuidCleaner,
    cleanGroupId: uuidCleaner,
    cleanType: stringCleaner,
    cleanVisibility: stringCleaner,
    cleanFileId: uuidCleaner,
    cleanLinkPreviewId: uuidCleaner,
    cleanSharedPostId: uuidCleaner,
    cleanSiteModerationId: uuidCleaner,
    cleanGroupModerationId: uuidCleaner,
    cleanContent: stringCleaner,
    clean: clean
}
