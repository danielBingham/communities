import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ArrowLeftStartOnRectangleIcon, ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { resetEntities } from '/state/lib'

import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { postGroupMembers, patchGroupMember, deleteGroupMember } from '/state/GroupMember'

import AreYouSure from '/components/AreYouSure'
import ErrorModal from '/components/errors/ErrorModal'
import Button from '/components/generic/button/Button'

import './GroupActionMenu.css'

const GroupMembershipButton = function({ groupId, userId }) {
    const [ areYouSure, setAreYouSure ] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [ group ] = useGroup(groupId)

    const [ currentMember ] = useGroupMember(groupId, currentUser?.id)
    const [ member ]  = useGroupMember(groupId, userId)

    const dispatch = useDispatch()

    /* ==================== When currentUser is user... ======================= */

    /**
     * ...and user is not yet a group member, and the group is 'open', they can
     * join the group.
     */ 
    const joinGroup = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId,
            status: 'member',
            role: 'member'
        }
        makeRequest(postGroupMembers(groupMember))
    }

    /**
     * ..and user is not a group member, and the group is 'private', then they
     * can request entrance.
     */
    const requestEntrance = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId,
            status: 'pending-requested',
            role: 'member'

        }
        makeRequest(postGroupMembers(groupMember))
    }

    /**
     * ...and user has been invited to the group, they can accept the invite.
     */
    const acceptInvite = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId,
            status: 'member'
        }
        makeRequest(patchGroupMember(groupMember))
    }

    /**
     * ...and user has been invited to the group, they can reject the invite.
     */
    const rejectInvite = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId
        }
        makeRequest(deleteGroupMember(groupMember))
        dispatch(resetEntities())
    }

    /**
     * ...and user has rejected entrance to the group, they can cancel the
     * request.
     */
    const cancelRequest = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId
        }
        makeRequest(deleteGroupMember(groupMember))
    }

    /**
     * ...and user is a member of the group, they can leave the group.
     */
    const leaveGroup = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId
        }
        makeRequest(deleteGroupMember(groupMember))
        dispatch(resetEntities())
    }

    /* =================== When currentUser is admin... ======================== */
    /**
     * ...and user has requested entrance, currentUser can accept user.
     */
    const acceptRequest = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId,
            status: 'member'
        }
        makeRequest(patchGroupMember(groupMember))

    }

    /**
     * ...and user has requested entrance, currentUser can reject user.
     */
    const rejectRequest = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId
        }
        makeRequest(deleteGroupMember(groupMember))
    }

    /**
     * ...and user has requested entrance, currentUser can reject user.
     */
    const cancelInvite = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId
        }
        makeRequest(deleteGroupMember(groupMember))
    }

    /**
     * ...and user has requested entrance, currentUser can reject user.
     */
    const removeMember = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId
        }
        makeRequest(deleteGroupMember(groupMember))
    }

    if ( ! currentUser || ! group ) {
        return null
    }

    let errorView = null
    if ( request && request.state == 'failed' ) {
        if ( request.error && request.error.type == 'not-authorized' ) {
            errorView = (
                <ErrorModal>{ request.error.message }</ErrorModal>
            )
        }
    }

    // The member we're showing is the current user and they aren't a member of
    // the group yet.
    if ( ! member && ! currentMember && currentUser.id == userId ) {
        return (
            <> 
                { errorView }
                { group.type == 'open' && <Button type="primary" onClick={() => joinGroup()}><ArrowLeftEndOnRectangleIcon /> <span className="nav-text">Join</span></Button> }
                { group.type == 'private' && <Button type="primary" onClick={() => requestEntrance()}><ArrowLeftEndOnRectangleIcon /> <span className="nav-text">Request</span></Button> }
            </>
        )
    }

    // The member we're showing is current user and they are a member, have a
    // pending invite, or have pending request.
    if ( userId == currentUser.id && member ) {
        return (
            <>
                { errorView }
                { member.status == 'pending-invited' && <Button type="primary" onClick={() => acceptInvite()}><ArrowLeftEndOnRectangleIcon /> <span className="nav-text">Accept</span></Button> }
                { member.status == 'pending-invited' && <Button onClick={() => rejectInvite()}><ArrowLeftStartOnRectangleIcon /> <span className="nav-text">Reject</span></Button> }
                { member.status == 'pending-requested' && <Button onClick={() => cancelRequest()}><ArrowLeftStartOnRectangleIcon /> <span className="nav-text">Cancel</span></Button> }
                { member.status == 'member' && <Button onClick={() => setAreYouSure(true)}><ArrowLeftStartOnRectangleIcon /> <span className="nav-text">Leave</span></Button> }
                <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); leaveGroup() }} cancel={() => setAreYouSure(false)} > 
                    <p>Are you sure you want to leave this group?</p>
                </AreYouSure>
            </>
        )
    }

    const canAdmin = currentMember && member && currentMember.userId != member.userId && (currentMember.role == 'admin' || currentMember.role == 'moderator')

    if ( currentUser.id != userId && member && canAdmin ) {
        return (
            <>
                { errorView }
                { member.status == 'pending-invited' && <Button  onClick={() => cancelInvite()}><ArrowLeftStartOnRectangleIcon /> <span className="nav-text">Cancel</span></Button> }
                { member.status == 'pending-requested' && <Button type="primary" onClick={() => acceptRequest()}><ArrowLeftEndOnRectangleIcon /> <span className="nav-text">Accept</span></Button> }
                { member.status == 'pending-requested' && <Button onClick={() => rejectRequest()}><ArrowLeftStartOnRectangleIcon /> <span className="nav-text">Reject</span></Button> }
                { member.status == 'member' && <Button onClick={() => removeMember()}><ArrowLeftStartOnRectangleIcon /> <span className="nav-text">Remove</span></Button> }
            </>
        )
    } else {
        return null
    }
}

export default GroupMembershipButton 
