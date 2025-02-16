import React from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { postGroupMembers, patchGroupMember, deleteGroupMember } from '/state/groupMembers'

import Button from '/components/generic/button/Button'

import './GroupActionMenu.css'

const GroupMembershipButton = function({ groupId, userId }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const currentMember = useSelector((state) => groupId !== null 
        && groupId in state.groupMembers.byGroupAndUser 
        && currentUser && currentUser.id in state.groupMembers.byGroupAndUser[groupId] 
            ? state.groupMembers.byGroupAndUser[groupId][currentUser.id] : null)

    const group = useSelector((state) => groupId !== null && groupId in state.groups.dictionary ? state.groups.dictionary[groupId] : null)
    const member = useSelector((state) => groupId !== null 
        && groupId in state.groupMembers.byGroupAndUser 
        && userId && userId in state.groupMembers.byGroupAndUser[groupId] 
            ? state.groupMembers.byGroupAndUser[groupId][userId] : null)

    /* ==================== When currentUser is user... ======================= */

    /**
     * ...and user is not yet a group member, and the group is 'open', they can
     * join the group.
     */ 
    const joinGroup = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId,
            status: 'member'
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
            status: 'pending-requesteded'
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

    // The member we're showing is the current user and they aren't a member of
    // the group yet.
    if ( ! member && ! currentMember && currentUser.id == userId ) {
        return (
            <span> 
                { group.type == 'open' && <Button type="primary" onClick={() => joinGroup()}>Join</Button> }
                { group.type == 'private' && <Button type="primary" onClick={() => requestEntrance()}>Request</Button> }
            </span>
        )
    }

    // The member we're showing is current user and they are a member, have a
    // pending invite, or have pending request.
    if ( userId == currentUser.id && member ) {
        return (
            <span>
                { member.status == 'pending-invited' && <Button type="primary" onClick={() => acceptInvite()}>Accept</Button> }
                { member.status == 'pending-invited' && <Button type="secondary-warn" onClick={() => rejectInvite()}>Reject</Button> }
                { member.status == 'pending-requested' && <Button type="secondary-warn" onClick={() => cancelRequest()}>Cancel</Button> }
                { member.status == 'member' && <Button type="secondary-warn" onClick={() => leaveGroup()}>Leave</Button> }
            </span>
        )
    }

    const canAdmin = currentMember && currentMember.userId != member.userId && (currentMember.role == 'admin' || currentMember.role == 'moderator')

    if ( currentUser.id != userId && member && canAdmin ) {
        return (
            <span>
                { member.status == 'pending-invited' && <Button type="secondary-warn" onClick={() => cancelInvite()}>Cancel</Button> }
                { member.status == 'pending-requested' && <Button type="primary" onClick={() => acceptRequest()}>Accept</Button> }
                { member.status == 'pending-requested' && <Button type="secondary-warn" onClick={() => rejectRequest()}>Reject</Button> }
                { member.status == 'member' && <Button type="secondary-warn" onClick={() => removeMember()}>Remove</Button> }
            </span>
        )
    } else {
        return null
    }
}

export default GroupMembershipButton 
