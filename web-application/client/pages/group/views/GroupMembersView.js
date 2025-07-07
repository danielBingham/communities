import React from 'react'
import { useSelector } from 'react-redux'

import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { 
    GroupPermissions, useGroupPermission,
    GroupMemberPermissions, useGroupMemberPermission

} from '/lib/hooks/permission'

import Spinner from '/components/Spinner'

import GroupInvite from '/components/groups/components/GroupInvite'
import GroupMembersList from '/components/groups/members/GroupMembersList'

import './GroupMembersView.css'

const GroupMembersView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [group, groupRequest] = useGroup(groupId)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const context = {
        group: group,
        userMember: currentMember
    }

    const canViewGroup = useGroupPermission(currentUser, GroupPermissions.VIEW, context)
    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, context)
    const canQueryGroupMember = useGroupMemberPermission(currentUser, GroupMemberPermissions.QUERY, context)

    if ( ! group && ( ! groupRequest || groupRequest.state === 'pending' )
        || (currentMember === undefined || ( currentMemberRequest?.state === 'pending')) ) 
    {
        return ( <div className="group-members-view"><Spinner /></div> )
    }

    if ( canViewGroup !== true || canQueryGroupMember !== true ) {
        return (
            <div className="group-members-view">
                <div className="group-members-view__private">The contents of this group are private.</div>
            </div>
        )
    }

    return (
        <div className="group-members-view">
            { canModerateGroup && <GroupInvite groupId={groupId} /> }
            <GroupMembersList groupId={groupId} />
        </div>
    )
}

export default GroupMembersView 
