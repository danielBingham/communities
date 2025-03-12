import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroupMember } from '/state/groupMembers'

export const useGroupMember = function(groupId, userId) {
    const [error, setError] = useState(null)

    const currentMember = useSelector((state) => groupId && userId
        && groupId in state.groupMembers.byGroupAndUser 
        && userId in state.groupMembers.byGroupAndUser[groupId] 
            ? state.groupMembers.byGroupAndUser[groupId][userId] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( groupId && userId && ! currentMember ) {
            makeRequest(getGroupMember(groupId, userId))
        }
    }, [ groupId, userId, currentMember])

    useEffect(() => {
        if ( request && request.state == 'failed' ) {
            setError(request.error)
        }
    }, [ request ])

    return [ currentMember, error, request ]

}
