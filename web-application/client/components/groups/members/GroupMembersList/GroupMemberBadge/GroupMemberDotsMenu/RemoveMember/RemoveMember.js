import React, { useState, useEffect, useContext } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useUser } from '/lib/hooks/User'

import { deleteGroupMember } from '/state/GroupMember'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'
import AreYouSure from '/components/AreYouSure'
import { RequestErrorModal } from '/components/errors/RequestError'

import './RemoveMember.css'

const RemoveMember = function({ groupId, userId }) {
    const [areYouSure, setAreYouSure] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const [user, userRequest] = useUser(userId)
    const [userMember, userMemberRequest] = useGroupMember(groupId, userId)

    const closeMenu = useContext(CloseMenuContext)

    const removeMember = () => {
        makeRequest(deleteGroupMember({ groupId: groupId, userId: userId }))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            closeMenu()
        }
    }, [ request ])

    if ( ! currentMember || ! userMember ) {
        return null
    }

    if ( userId === currentUser.id ) {
        return null
    }

    if ( userMember.status === 'banned' ) {
        return null
    }

    const canRemoveMember = ( currentMember.role === 'admin' || currentMember.role === 'moderator' ) && userMember.role === 'member'

    if ( canRemoveMember !== true ) {
        return null
    }

    let text = 'Remove Member'
    if ( userMember.status === 'pending-invited' ) {
        text = 'Cancel Invite'
    } else if( userMember.status === 'pending-requested' ) {
        text = 'Reject Request'
    }

    return (
        <>
            <DotsMenuItem onClick={() => setAreYouSure(true)}>{ text }</DotsMenuItem> 
            <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); removeMember() }} cancel={() => setAreYouSure(false)} > 
                <p>Are you sure you want to remove { user.name } from this group?</p>
            </AreYouSure>
            <RequestErrorModal message="Attempt to remove member" request={request} />
        </>
    )
}

export default RemoveMember


