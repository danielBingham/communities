import { resetUserSlice } from '/state/User'
import { resetUserRelationshipSlice } from '/state/UserRelationship'

export const resetEntities = function() {
    return function(dispatch, getState) {
        dispatch(resetUserSlice())
        dispatch(resetUserRelationshipSlice())
    }
}
