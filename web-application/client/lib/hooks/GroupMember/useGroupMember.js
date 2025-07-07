import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroupMember, setGroupMembersInDictionary } from '/state/GroupMember'

export const useGroupMember = function(groupId, userId) {
    const groupMember = useSelector((state) => {
        if ( ! groupId || ! userId ) {
            return null 
        }

        if ( ! ( groupId in state.GroupMember.byGroupAndUser ) ) {
            return null 
        }

        if ( ! ( userId in state.GroupMember.byGroupAndUser[groupId] ) ) {
            return null 
        }

        return state.GroupMember.byGroupAndUser[groupId][userId]
    })

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( groupId && userId && ! groupMember && ! request ) {
            makeRequest(getGroupMember(groupId, userId))
        }
    }, [ groupId, userId, groupMember, request])

    return [ groupMember, request ]
}
