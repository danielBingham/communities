import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useUser } from '/lib/hooks/User'

import { patchGroupMember } from '/state/GroupMember'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'
import AreYouSure from '/components/AreYouSure'
import ErrorModal from '/components/errors/ErrorModal'

import './BanMember.css'

const BanMember = function({ groupId, userId }) {
    const [areYouSure, setAreYouSure] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const [user, userRequest] = useUser(userId)
    const [userMember, userMemberRequest] = useGroupMember(groupId, userId)

    const ban = function() {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, status: 'banned' }))
    }

    const unban = function() {
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

    const canBanMember = ( currentMember.role === 'admin' || currentMember.role === 'moderator' ) && userMember.role === 'member'

    if ( canBanMember !== true ) {
        return null
    }

    if ( userMember.status === 'banned' ) {
        return (
            <>
                <FloatingMenuItem onClick={() => setAreYouSure(true)}>Unban Member</FloatingMenuItem> 
                <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); unban() }} cancel={() => setAreYouSure(false)} > 
                    <p>Are you sure you want to unban { user.name }?</p>
                </AreYouSure>
            </>
        )

    } else {
        return (
            <>
                <FloatingMenuItem onClick={() => setAreYouSure(true)}>Ban Member</FloatingMenuItem> 
                <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); ban() }} cancel={() => setAreYouSure(false)} > 
                    <p>Are you sure you want to ban { user.name }?</p>
                </AreYouSure>
            </>
        )
    }
}

export default BanMember


