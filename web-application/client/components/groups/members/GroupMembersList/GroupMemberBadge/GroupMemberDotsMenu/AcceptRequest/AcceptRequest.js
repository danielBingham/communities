import React, { useEffect, useContext } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { patchGroupMember } from '/state/GroupMember'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'
import { RequestErrorModal } from '/components/errors/RequestError'

import './AcceptRequest.css'

const AcceptRequest = function({ groupId, userId }) {
    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const [userMember, userMemberRequest] = useGroupMember(groupId, userId)

    const closeMenu = useContext(CloseMenuContext)

    const accept = function() {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, status: 'member' }))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            closeMenu()
        }
    }, [ request ])

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
            <DotsMenuItem onClick={() => accept()}>Accept Request</DotsMenuItem> 
            <RequestErrorModal message={`Attempt to accept member's request`} request={request} />
        </>
    )
}

export default AcceptRequest


