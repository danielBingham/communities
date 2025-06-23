import React from 'react'
import { useSelector } from 'react-redux'

import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'

import { deleteGroupMember } from '/state/GroupMember'

import Button from '/components/generic/button/Button'

const LeaveGroup = function({ groupId }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const currentMember = useSelector((state) => groupId !== null 
        && groupId in state.GroupMember.byGroupAndUser 
        && currentUser && currentUser.id in state.GroupMember.byGroupAndUser[groupId] 
            ? state.GroupMember.byGroupAndUser[groupId][currentUser.id] : null)

    const leaveGroup = function() {
        makeRequest(deleteGroupMember())
    }

    if ( ! currentMember ) {
        return null
    }

    if ( currentMember.status == 'pending-requested' ) {
        
    }

    return (
        <span>
            { currentMember.status == 'member' &&  <Button onClick={() => leaveGroup()}><ArrowRightStartOnRectangleIcon /> <span>Leave</span></Button>    }
            { currentMember.status == 'pending-requested' && <Button onClick={() => leaveGroup()}><ArrowRightStartOnRectangleIcon /><span>Cancel Request</span></Button> }
        </span>
    )
}

export default LeaveGroup
