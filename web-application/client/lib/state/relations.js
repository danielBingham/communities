import { setFilesInDictionary, removeFile } from '/state/files'
import { setGroupMembersInDictionary, removeGroupMember } from '/state/groupMembers'
import { setPostsInDictionary, removePost } from '/state/posts'
import { setPostCommentsInDictionary, removePostComment } from '/state/postComments'
import { setPostReactionsInDictionary, removePostReaction } from '/state/postReactions'
import { setPostSubscriptionsInDictionary, removePostSubscription } from '/state/postSubscriptions'
import { setSiteModerationsInDictionary, removeSiteModeration } from '/state/admin/siteModeration'
import { setUsersInDictionary, removeUser } from '/state/users'
import { setUserRelationshipsInDictionary, removeUserRelationship } from '/state/userRelationships'

console.log(`importing: `)
console.log(setUsersInDictionary)

const entityMap = {
    files: {
        set: setFilesInDictionary, remove: removeFile
    },
    groupMembers: {
        set: setGroupMembersInDictionary, remove: removeGroupMember
    },
    posts: {
        set: setPostsInDictionary, remove: removePost
    },
    postComments: {
        set: setPostCommentsInDictionary, remove: removePostComment
    },
    postReactions: {
        set: setPostReactionsInDictionary, remove: removePostReaction
    },
    postSubscriptions: {
        set: setPostSubscriptionsInDictionary, remove: removePostSubscription
    },
    siteModerations: {
        set: setSiteModerationsInDictionary, remove: removeSiteModeration
    },
    users: {
        set: setUsersInDictionary, remove: removeUser
    },
    userRelationships: {
        set: setUserRelationshipsInDictionary, remove: removeUserRelationship
    }
}

export const setRelationsInState = function(relations) {
    return function(dispatch, getState) {

        console.log(`EntityMap: `)
        console.log(entityMap)
        if ( relations !== undefined && relations !== null ) {
            for(const [relation, dictionary] of Object.entries(relations)) {
                console.log(`Setting relation: '${relation}'`)
                console.log(entityMap[relation])
                console.log(entityMap)
                dispatch(entityMap[relation].set({ dictionary: dictionary }))
            }
        }
    }
}

export const cleanupRelations = function(relations) {
    if ( relations !== undefined && relations !== null ) {
        for(const [relation, dictionary] of Object.entries(relations)) {
            for(const [id, entity] of Object.entries(dictionary)) {
                dispatch(entityMap[relation].remove({ entity: entity }))
            }
        }
    }
}
