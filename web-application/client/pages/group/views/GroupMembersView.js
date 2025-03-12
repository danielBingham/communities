import React from 'react'
import { useSelector } from 'react-redux'

import { useGroup, useGroupMember } from '/lib/hooks/group'

import { canView, canModerate } from '/lib/group'

import GroupInvite from '/components/groups/components/GroupInvite'
import GroupMembersList from '/components/groups/members/list/GroupMembersList'

const GroupMembersView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [group, groupError] = useGroup(groupId) 
    const [currentMember, currentMemberError] = useGroupMember(groupId, currentUser?.id)

    if ( ! canView(group, currentMember) ) {
        return (<div className="group-members-view__private">The contents of this group are private.</div>)
    }

    return (
        <div className="group-members-view">
            { canModerate(group, currentMember) && <GroupInvite groupId={groupId} /> }
            <GroupMembersList groupId={groupId} />
        </div>
    )
}

export default GroupMembersView 
