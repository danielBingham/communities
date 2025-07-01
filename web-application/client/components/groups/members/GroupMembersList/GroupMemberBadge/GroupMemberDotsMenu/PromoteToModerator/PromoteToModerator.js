import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { FlagIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useUser } from '/lib/hooks/User'

import { patchGroupMember } from '/state/GroupMember'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'
import AreYouSure from '/components/AreYouSure'

import './PromoteToModerator.css'

const PromoteToModerator = function({ groupId, userId }) {
    const [areYouSure, setAreYouSure] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const [user, userRequest] = useUser(userId)
    const [userMember, userMemberRequest] = useGroupMember(groupId, userId)

    const promote = function() {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, role: 'moderator' }))
    }

    const demote = function() {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, role: 'member' }))
    }

    if ( ! currentMember || ! userMember ) {
        return null
    }

    if ( userMember.status === 'banned' ) {
        return null
    }

    // TODO When currentUser === user offer "Step down to Moderator"
    if ( userMember.role === 'moderator' ) {
        if ( currentMember.role === 'admin' || currentUser.id === userMember.userId ) {
            return (
                <>
                    <FloatingMenuItem onClick={() => setAreYouSure(true)}>{ currentUser.id === userMember.userId ? 'Resign Moderator': 'Demote to Member' }</FloatingMenuItem> 
                    <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); demote() }} cancel={() => setAreYouSure(false)} > 
                        <p>Are you sure you want to { currentUser.id === userMember.userId ? 'resign' : `demote ${user.name}` }?</p>
                    </AreYouSure>
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
            <FloatingMenuItem onClick={() => setAreYouSure(true)}>Promote to Moderator</FloatingMenuItem> 
            <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); promote() }} cancel={() => setAreYouSure(false)} > 
                <p>Are you sure you want to promote { user.name } to moderator?</p>
            </AreYouSure>
        </>
    )
}

export default PromoteToModerator


