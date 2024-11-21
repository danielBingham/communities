import { setTagsInDictionary } from '../tags'
import { setUsersInDictionary } from '../users'
import { setPostsInDictionary } from '../posts'
import { setPostCommentsInDictionary } from '../postComments'
import { setFilesInDictionary } from '../files'


const setRelationsInState = function(relations) {
    return function(dispatch, getState) {
        if ( relations ) {
            for(const [relation, dictionary] of Object.entries(relations)) {
                if ( relation == 'tags' ) {
                    dispatch(setTagsInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'users' ) {
                    dispatch(setUsersInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'postComments' ) {
                    dispatch(setPostCommentsInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'posts' ) {
                    dispatch(setPostsInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'files' ) {
                    dispatch(setFilesInDictionary({ dictionary: dictionary }))
                }
            }
        }
    }
}

export default setRelationsInState
