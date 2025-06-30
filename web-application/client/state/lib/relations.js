import logger from '/logger'

import { setFilesInDictionary, removeFile } from '/state/File/slice'
import { setGroupsInDictionary, removeGroup } from '/state/Group'
import { setGroupMembersInDictionary, removeGroupMember } from '/state/GroupMember/slice'
import { setGroupModerationsInDictionary, removeGroupModeration } from '/state/GroupModeration/slice'
import { setLinkPreviewsInDictionary, removeLinkPreview } from '/state/LinkPreview/slice'
import { setPostsInDictionary, removePost } from '/state/Post/slice'
import { setPostCommentsInDictionary, removePostComment } from '/state/PostComment/slice'
import { setPostReactionsInDictionary, removePostReaction } from '/state/PostReaction/slice'
import { setPostSubscriptionsInDictionary, removePostSubscription } from '/state/PostSubscription/slice'
import { setSiteModerationsInDictionary, removeSiteModeration } from '/state/SiteModeration/slice'
import { setUsersInDictionary, removeUser } from '/state/User/slice'
import { setUserRelationshipsInDictionary, removeUserRelationship } from '/state/UserRelationship/slice'

const entityMap = {
    files: { set: setFilesInDictionary, remove: removeFile },
    groups: { set: setGroupsInDictionary, remove: removeGroup },
    groupMembers: { set: setGroupMembersInDictionary, remove: removeGroupMember },
    groupModerations: { set: setGroupModerationsInDictionary, remove: removeGroupModeration },
    linkPreviews: { set: setLinkPreviewsInDictionary, remove: removeLinkPreview },
    posts: { set: setPostsInDictionary, remove: removePost },
    postComments: { set: setPostCommentsInDictionary, remove: removePostComment },
    postReactions: { set: setPostReactionsInDictionary, remove: removePostReaction },
    postSubscriptions: { set: setPostSubscriptionsInDictionary, remove: removePostSubscription },
    siteModerations: { set: setSiteModerationsInDictionary, remove: removeSiteModeration },
    users: { set: setUsersInDictionary, remove: removeUser },
    userRelationships: { set: setUserRelationshipsInDictionary, remove: removeUserRelationship }
}

export const setRelationsInState = function(relations) {
    return function(dispatch, getState) {
        if ( relations !== undefined && relations !== null ) {
            for(const [relation, dictionary] of Object.entries(relations)) {
                if ( ! ( relation in entityMap ) ) {
                    logger.warn(`Entity '${relation}' is missing from the 'entityMap'.`)
                    continue
                }

                dispatch(entityMap[relation].set({ dictionary: dictionary }))
            }
        }
    }
}

export const cleanupRelations = function(relations) {
    return function(dispatch, getState) {
        if ( relations !== undefined && relations !== null ) {
            for(const [relation, dictionary] of Object.entries(relations)) {
                for(const [id, entity] of Object.entries(dictionary)) {
                    if ( ! ( relation in entityMap ) ) {
                        logger.warn(`Entity '${relation}' is missing from the 'entityMap'.`)
                        continue
                    }

                    dispatch(entityMap[relation].remove({ entity: entity }))
                }
            }
        }
    }
}
