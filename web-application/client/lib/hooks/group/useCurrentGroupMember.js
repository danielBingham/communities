import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroupMember } from '/state/groupMembers'

export const useCurrentGroupMember = function(groupId) {
    const [error, setError] = useState(null)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const currentMember = useSelector((state) => groupId 
        && groupId in state.groupMembers.byGroupAndUser 
        && currentUser.id in state.groupMembers.byGroupAndUser[groupId] 
            ? state.groupMembers.byGroupAndUser[groupId][currentUser.id] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( groupId && currentUser && ! currentMember ) {
            makeRequest(getGroupMember(groupId, currentUser.id))
        }
    }, [ groupId, currentUser, currentMember])

    useEffect(() => {
        if ( request && request.state == 'failed' ) {
            setError(request.error)
        }
    }, [ request ])

    return [ currentMember, error ]

}
