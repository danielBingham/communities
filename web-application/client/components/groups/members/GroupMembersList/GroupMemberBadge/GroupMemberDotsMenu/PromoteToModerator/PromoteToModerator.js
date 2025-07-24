import React, { useState, useEffect, useContext } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useUser } from '/lib/hooks/User'

import { patchGroupMember } from '/state/GroupMember'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'
import AreYouSure from '/components/AreYouSure'
import { RequestErrorModal } from '/components/errors/RequestError'

import './PromoteToModerator.css'

const PromoteToModerator = function({ groupId, userId }) {
    const [areYouSure, setAreYouSure] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const [user, userRequest] = useUser(userId)
    const [userMember, userMemberRequest] = useGroupMember(groupId, userId)

    const closeMenu = useContext(CloseMenuContext)

    const promote = function() {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, role: 'moderator' }))
    }

    const demote = function() {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, role: 'member' }))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled') {
            closeMenu()
        }
    }, [ request ])

    if ( ! currentMember || ! userMember ) {
        return null
    }

    if ( userMember.status !== 'member' ) {
        return null
    }

    // TODO When currentUser === user offer "Step down to Moderator"
    if ( userMember.role === 'moderator' ) {
        if ( currentMember.role === 'admin' || currentUser.id === userMember.userId ) {
            return (
                <>
                    <DotsMenuItem onClick={() => setAreYouSure(true)}>{ currentUser.id === userMember.userId ? 'Resign Moderator': 'Demote to Member' }</DotsMenuItem> 
                    <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); demote() }} cancel={() => setAreYouSure(false)} > 
                        <p>Are you sure you want to { currentUser.id === userMember.userId ? 'resign' : `demote ${user.name}` }?</p>
                    </AreYouSure>
                    <RequestErrorModal message="Attempt to demote moderator" request={request} />
                </>
            )
        } else {
            return null
        }
    }

    const canPromoteToModerator = currentMember.role === 'admin' && userMember.role === 'member'
    if ( canPromoteToModerator !== true ) {
        return null
    }

    return (
        <>
            <DotsMenuItem onClick={() => setAreYouSure(true)}>Promote to Moderator</DotsMenuItem> 
            <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); promote() }} cancel={() => setAreYouSure(false)} > 
                <p>Are you sure you want to promote { user.name } to moderator?</p>
            </AreYouSure>
            <RequestErrorModal message="Attempt to promote moderator" request={request} />
        </>
    )
}

export default PromoteToModerator


