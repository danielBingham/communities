import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroupMember } from '/state/GroupMember'

export const useGroupMember = function(groupId, userId) {
    const currentMember = useSelector((state) => groupId && userId
        && groupId in state.GroupMember.byGroupAndUser 
        && userId in state.GroupMember.byGroupAndUser[groupId] 
            ? state.GroupMember.byGroupAndUser[groupId][userId] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( groupId && userId && ! currentMember ) {
            makeRequest(getGroupMember(groupId, userId))
        }
    }, [ groupId, userId, currentMember])

    return [ currentMember, request ]
}
