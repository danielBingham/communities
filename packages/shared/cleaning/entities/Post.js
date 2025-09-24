const { cleanUuid, stringCleaner, intCleaner } = require('../types')
const { cleanEntity } = require('../clean')

const clean = function(postSubscription) {
    const cleaners = {
        id: cleanUuid,
        userId: cleanUuid,
        groupId: cleanUuid,
        type: stringCleaner,
        visibility: stringCleaner,
        fileId: cleanUuid,
        linkPreviewId: cleanUuid,
        sharedPostId: cleanUuid,
        siteModerationId: cleanUuid,
        groupModerationId: cleanUuid,
        activity: null,
        content: stringCleaner,
        createdDate: null,
        updatedDate: null 
    }
    return cleanEntity(postSubscription, cleaners)
}

module.exports = {
    cleanId: cleanUuid,
    cleanUserId: cleanUuid,
    cleanGroupId: cleanUuid,
    cleanType: stringCleaner,
    cleanVisibility: stringCleaner,
    cleanFileId: cleanUuid,
    cleanLinkPreviewId: cleanUuid,
    cleanSharedPostId: cleanUuid,
    cleanSiteModerationId: cleanUuid,
    cleanGroupModerationId: cleanUuid,
    cleanContent: stringCleaner,
    clean: clean
}
