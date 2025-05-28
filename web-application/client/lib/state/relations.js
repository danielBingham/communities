import { setFilesInDictionary } from '/state/files'
import { setGroupMembersInDictionary } from '/state/groupMembers'
import { setPostsInDictionary } from '/state/posts'
import { setPostCommentsInDictionary } from '/state/postComments'
import { setPostReactionsInDictionary } from '/state/postReactions'
import { setPostSubscriptionsInDictionary } from '/state/postSubscriptions'
import { setSiteModerationsInDictionary } from '/state/admin/siteModeration'
import { setUsersInDictionary } from '/state/users'
import { setUserRelationshipsInDictionary } from '/state/userRelationships'


const setRelationsInState = function(relations) {
    return function(dispatch, getState) {
        if ( relations ) {
            for(const [relation, dictionary] of Object.entries(relations)) {
                if ( relation == 'files' ) {
                    dispatch(setFilesInDictionary({ dictionary: dictionary }))
                } 
                else if ( relation == 'groupMembers' ) {
                    dispatch(setGroupMembersInDictionary({ dictionary: dictionary }))
                }
                else if ( relation == 'posts' ) {
                    dispatch(setPostsInDictionary({ dictionary: dictionary }))
                } 
                else if ( relation == 'postComments' ) {
                    dispatch(setPostCommentsInDictionary({ dictionary: dictionary }))
                } 
                else if ( relation == 'postReactions' ) { 
                    dispatch(setPostReactionsInDictionary({ dictionary: dictionary }))
                } 
                else if ( relation == 'postSubscriptions' ) {
                    dispatch(setPostSubscriptionsInDictionary({ dictionary: dictionary }))
                } 
                else if ( relation === 'siteModerations' ) {
                    dispatch(setSiteModerationsInDictionary({ dictionary: dictionary }))
                }
                else if ( relation == 'users' ) {
                    dispatch(setUsersInDictionary({ dictionary: dictionary }))
                } 
                else if ( relation == 'userRelationships' ) {
                    dispatch(setUserRelationshipsInDictionary({ dictionary: dictionary }))
                }
            }
        }
    }
}

export default setRelationsInState
