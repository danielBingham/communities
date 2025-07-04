import React from 'react'
import { useSelector } from 'react-redux'

import { 
    GroupPermissions, useGroupPermission,
    GroupMemberPermissions, useGroupMemberPermission

} from '/lib/hooks/permission'

import GroupInvite from '/components/groups/components/GroupInvite'
import GroupMembersList from '/components/groups/members/GroupMembersList'

const GroupMembersView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const canViewGroup = useGroupPermission(currentUser, GroupPermissions.VIEW, groupId)
    const canViewGroupMember = useGroupMemberPermission(currentUser, GroupMemberPermissions.VIEW, groupId)

    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, groupId)

    if ( canViewGroup !== true || canViewGroupMember !== true ) {
        return (<div className="group-members-view__private">You don't have permission to view members of this group.</div>)
    }

    return (
        <div className="group-members-view">
            { canModerateGroup && <GroupInvite groupId={groupId} /> }
            <GroupMembersList groupId={groupId} />
        </div>
    )
}

export default GroupMembersView 
