import React from 'react'
import { useSelector } from 'react-redux'

import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'

import { postGroupMembers } from '/state/groupMembers'

import Button from '/components/generic/button/Button'

import './JoinGroup.css'

const JoinGroup = function({ groupId }) {

    const [request, makeRequest] = useRequest()

    const group = useSelector((state) => groupId !== null && groupId in state.groups.dictionary 
        ? state.groups.dictionary[groupId] : null)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const currentMember = useSelector((state) => groupId !== null 
        && groupId in state.groupMembers.byGroupAndUser 
        && currentUser && currentUser.id in state.groupMembers.byGroupAndUser[groupId] 
            ? state.groupMembers.byGroupAndUser[groupId][currentUser.id] : null)

    const joinGroup = function() {
        makeRequest(postGroupMembers({ groupId: groupId, userId: currentUser.id }))

    }

    if ( currentMember ) {
        return null
    }

    if ( group.type == 'hidden' ) {
        return null
    }


    return (
        <Button type="primary" onClick={() => joinGroup()}><ArrowRightEndOnRectangleIcon /> { group.type == 'open' ? <span className="text">Join</span> : <span className="text">Request</span> }</Button>    
    )
}

export default JoinGroup
