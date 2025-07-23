import React, { useState, useEffect, useContext } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useUser } from '/lib/hooks/User'

import { patchGroupMember } from '/state/GroupMember'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'
import AreYouSure from '/components/AreYouSure'
import { RequestErrorModal } from '/components/errors/RequestError'

import './PromoteToAdmin.css'

const PromoteToAdmin = function({ groupId, userId }) {
    const [areYouSure, setAreYouSure] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const [user, userRequest] = useUser(userId)
    const [userMember, userMemberRequest] = useGroupMember(groupId, userId)

    const closeMenu = useContext(CloseMenuContext)

    const promote = function() {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, role: 'admin' }))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            closeMenu()
        }
    }, [ request ])

    if ( ! currentMember || ! userMember ) {
        return null
    }

    // TODO When currentUser === user offer "Step down to Moderator"

    const canPromoteToAdmin = currentMember.role === 'admin' && userMember.role === 'moderator'
    if ( canPromoteToAdmin !== true ) {
        return null
    }

    return (
        <>
            <DotsMenuItem onClick={() => setAreYouSure(true)}>Promote to Admin</DotsMenuItem> 
            <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); promote() }} cancel={() => setAreYouSure(false)} > 
                <p>Are you sure you want to promote { user.name } to admin?</p>
                <p>You won't be able to undo this.</p>
            </AreYouSure>
            <RequestErrorModal message="Attempt to promote admin" request={request} />
        </>
    )
}

export default PromoteToAdmin


