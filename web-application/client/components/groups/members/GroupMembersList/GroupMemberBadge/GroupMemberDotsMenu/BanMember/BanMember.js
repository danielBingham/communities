import React, { useState, useEffect, useContext } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useUser } from '/lib/hooks/User'

import { patchGroupMember } from '/state/GroupMember'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'
import AreYouSure from '/components/AreYouSure'
import { RequestErrorModal } from '/components/errors/RequestError'

import './BanMember.css'

const BanMember = function({ groupId, userId }) {
    const [areYouSure, setAreYouSure] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const [user, userRequest] = useUser(userId)
    const [userMember, userMemberRequest] = useGroupMember(groupId, userId)

    const closeMenu = useContext(CloseMenuContext)

    const ban = function() {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, status: 'banned' }))
    }

    const unban = function() {
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

    const canBanMember = ( currentMember.role === 'admin' || currentMember.role === 'moderator' ) && userMember.role === 'member'

    if ( canBanMember !== true ) {
        return null
    }

    if ( userMember.status === 'banned' ) {
        return (
            <>
                <DotsMenuItem onClick={() => setAreYouSure(true)}>Unban Member</DotsMenuItem> 
                <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); unban() }} cancel={() => setAreYouSure(false)} > 
                    <p>Are you sure you want to unban { user.name }?</p>
                </AreYouSure>
                <RequestErrorModal message="Attempt to unban member" request={request} />
            </>
        )

    } else {
        return (
            <>
                <DotsMenuItem onClick={() => setAreYouSure(true)}>Ban Member</DotsMenuItem> 
                <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); ban() }} cancel={() => setAreYouSure(false)} > 
                    <p>Are you sure you want to ban { user.name }?</p>
                </AreYouSure>
                <RequestErrorModal message="Attempt to ban member" request={request} />
            </>
        )
    }
}

export default BanMember


