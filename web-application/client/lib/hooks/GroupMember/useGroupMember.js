import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroupMember } from '/state/GroupMember'

export const useGroupMember = function(groupId, userId) {
    const groupMember = useSelector((state) => {
        if ( ! groupId || ! userId ) {
            return undefined 
        }

        if ( ! ( groupId in state.GroupMember.byGroupAndUser ) ) {
            return undefined 
        }

        if ( ! ( userId in state.GroupMember.byGroupAndUser[groupId] ) ) {
            return undefined 
        }

        return state.GroupMember.byGroupAndUser[groupId][userId]
    })

    const [request, makeRequest ] = useRequest()

    useEffect(() => {
        if ( groupId && userId && groupMember === undefined && request?.state !== 'pending') {
            makeRequest(getGroupMember(groupId, userId))
        }
    }, [ groupId, userId, groupMember, request])

    return [ groupMember, request ]
}
