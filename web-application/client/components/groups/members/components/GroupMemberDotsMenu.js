import React from 'react'
import { useSelector } from 'react-redux'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'

import { patchGroupMember } from '/state/groupMembers'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'


import './GroupMemberDotsMenu.css'

const GroupMemberDotsMenu = function({ groupId, userId }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const currentMember = useSelector((state) => currentUser && groupId in state.groupMembers.byGroupAndUser && currentUser.id in state.groupMembers.byGroupAndUser[groupId] ? state.groupMembers.byGroupAndUser[groupId][currentUser.id] : null)
    
    const user = useSelector((state) => userId in state.users.dictionary ? state.users.dictionary[userId] : null)
    const userMember = useSelector((state) => groupId in state.groupMembers.byGroupAndUser && userId in state.groupMembers.byGroupAndUser[groupId] ? state.groupMembers.byGroupAndUser[groupId][userId] : null)


    const promote = (role) => {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, role: role }))
    }

    const demote = (role) => {
        makeRequest(patchGroupMember({ groupId: groupId, userId: userId, role: role }))
    }

    if ( ! currentMember || (currentMember.role != 'admin' && currentMember.role != 'moderator')) {
        return null
    }

    const canPromoteModerator = currentMember.role == 'admin' && userMember.role == 'member'
    const canPromoteAdmin = currentMember.role == 'admin' && userMember.role == 'moderator'

    const canDemoteModerator = (currentMember.role == 'admin') && userMember.role == 'moderator'

    if ( ! canPromoteModerator && ! canPromoteAdmin && ! canDemoteModerator ) {
        return null
    }

    return (
        <FloatingMenu className="group-member-dots-menu" closeOnClick={true}>
            <FloatingMenuTrigger showArrow={false}><EllipsisHorizontalIcon className="dots" /></FloatingMenuTrigger>
            <FloatingMenuBody>
                { canPromoteModerator && <FloatingMenuItem onClick={() => promote('moderator')}>Promote to Moderator</FloatingMenuItem> }
                { canDemoteModerator && <FloatingMenuItem onClick={() => demote('member')}>{ currentUser.id == userId ? 'Step Down' : 'Demote' } to Member</FloatingMenuItem> }
                { canPromoteAdmin && <FloatingMenuItem onClick={() => promote('admin')}>Promote to Admin</FloatingMenuItem> }
            </FloatingMenuBody>
        </FloatingMenu>
        
    )
}

export default GroupMemberDotsMenu
