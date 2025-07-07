import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useUser } from '/lib/hooks/User'

import { patchGroupMember } from '/state/GroupMember'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'
import AreYouSure from '/components/AreYouSure'
import ErrorModal from '/components/errors/ErrorModal'

import './AcceptRequest.css'

const AcceptRequest = function({ groupId, userId }) {
    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const [userMember, userMemberRequest] = useGroupMember(groupId, userId)

    const accept = function() {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, status: 'member' }))
    }
    
    if ( request && request.state === 'failed' ) {
        return (
            <ErrorModal>
                <p>Attempt to { userMember && userMember.status === 'banned' ? 'unban' : 'ban' } member failed with error: { request.error ? request.error.type : 'unknown' }</p>
                { request.error && request.error.message && request.error.message.length > 0 && <p>{ request.error.message }</p> }
            </ErrorModal>
        )
    }

    if ( ! currentMember || ! userMember ) {
        return null
    }

    if ( userMember.status !== 'pending-requested' ) {
        return null
    }

    const canAcceptRequest = ( currentMember.role === 'admin' || currentMember.role === 'moderator' ) && userMember.role === 'member'
    if ( canAcceptRequest !== true ) {
        return null
    }


    return (
        <>
            <FloatingMenuItem onClick={() => accept()}>Accept Request</FloatingMenuItem> 
        </>
    )
}

export default AcceptRequest


