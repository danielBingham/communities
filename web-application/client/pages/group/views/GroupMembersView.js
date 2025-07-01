import React from 'react'
import { useSelector } from 'react-redux'

import { GroupPermissions, useGroupPermission } from '/lib/hooks/permission'

import GroupInvite from '/components/groups/components/GroupInvite'
import GroupMembersList from '/components/groups/members/GroupMembersList'

const GroupMembersView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const canViewGroup = useGroupPermission(currentUser, GroupPermissions.VIEW, groupId)
    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, groupId)

    if ( ! canViewGroup ) {
        return (<div className="group-members-view__private">The contents of this group are private.</div>)
    }

    return (
        <div className="group-members-view">
            { canModerateGroup && <GroupInvite groupId={groupId} /> }
            <GroupMembersList groupId={groupId} />
        </div>
    )
}

export default GroupMembersView 
