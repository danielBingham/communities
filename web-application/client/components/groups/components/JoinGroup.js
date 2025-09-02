import React from 'react'
import { useSelector } from 'react-redux'

import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { postGroupMembers } from '/state/GroupMember'

import Button from '/components/generic/button/Button'

import './JoinGroup.css'

const JoinGroup = function({ groupId }) {

    const [request, makeRequest] = useRequest()

    const group = useSelector((state) => groupId !== null && groupId in state.Group.dictionary 
        ? state.Group.dictionary[groupId] : null)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const joinGroup = function() {
        makeRequest(postGroupMembers(groupId, { groupId: groupId, userId: currentUser.id }))

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
