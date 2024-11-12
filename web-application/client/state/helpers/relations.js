import { setTagsInDictionary } from '../tags'
import { setUsersInDictionary } from '../users'


const setRelationsInState = function(relations) {
    return function(dispatch, getState) {
        if ( relations ) {
            for(const [relation, dictionary] of Object.entries(relations)) {
                if ( relation == 'tags' ) {
                    dispatch(setTagsInDictionary({ dictionary: dictionary }))
                } else if ( relation == 'users' ) {
                    dispatch(setUsersInDictionary({ dictionary: dictionary }))
                }
            }
        }
    }
}

export default setRelationsInState
