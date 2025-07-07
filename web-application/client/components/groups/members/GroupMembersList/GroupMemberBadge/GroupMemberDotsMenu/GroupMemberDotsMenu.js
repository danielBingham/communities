import React from 'react'
import { useSelector } from 'react-redux'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { patchGroupMember } from '/state/GroupMember'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import AcceptRequest from './AcceptRequest'
import BanMember from './BanMember'
import PromoteToAdmin from './PromoteToAdmin'
import PromoteToModerator from './PromoteToModerator'
import RemoveMember from './RemoveMember'


import './GroupMemberDotsMenu.css'

const GroupMemberDotsMenu = function({ groupId, userId }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)
    const [userMember, userMemberRequest] = useGroupMember(groupId, userId)


    if ( ! currentMember || (currentMember.role != 'admin' && currentMember.role != 'moderator')) {
        return null
    }

    if ( ! userMember || userMember.role === 'admin' ) {
        return null
    }

    return (
        <FloatingMenu className="group-member-dots-menu" closeOnClick={true}>
            <FloatingMenuTrigger showArrow={false}><EllipsisHorizontalIcon className="dots" /></FloatingMenuTrigger>
            <FloatingMenuBody>
                <PromoteToModerator groupId={groupId} userId={userId} />
                <PromoteToAdmin groupId={groupId} userId={userId} />
                <AcceptRequest groupId={groupId} userId={userId} />
                <BanMember groupId={groupId} userId={userId} />
                <RemoveMember groupId={groupId} userId={userId} />
            </FloatingMenuBody>
        </FloatingMenu>
        
    )
}

export default GroupMemberDotsMenu
