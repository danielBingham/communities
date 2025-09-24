import { useSelector } from 'react-redux'

import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { 
    GroupPermissions, useGroupPermission,
    GroupMemberPermissions, useGroupMemberPermission

} from '/lib/hooks/permission'

import Spinner from '/components/Spinner'
import Button from '/components/ui/Button'

import GroupMembersControls from '/components/groups/GroupMembersControls'
import GroupMembersList from '/components/groups/members/GroupMembersList'

import './GroupMembersView.css'

const GroupMembersView = function({ groupId, type }) {

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

    if ( ! canModerateGroup && type !== 'member' && type !== 'admin' ) {
        return null
    }

    let descriptor = 'Members'
    let params = { status: 'member' }
    if ( type === 'admin' ) {
        descriptor = 'Administrators'
        params = { role: [ 'admin', 'moderator' ] }
    } else if ( type === 'invitations' ) {
        descriptor = 'Invitations'
        params = { status: 'pending-invited', user: { status: 'confirmed' }}
    } else if ( type === 'requests' && group.type === 'private' ) {
        descriptor = 'Requests'
        params = { status: 'pending-requested' } 
    } else if ( type === 'banned' ) {
        descriptor = 'Banned Members'
        params = { status: 'banned' } 
    } else if ( type === 'email-invitations' ) {
        descriptor = 'Invitations'
        params = { status: 'pending-invited', user: { status: 'invited' }}
    }

    return (
        <div className="group-members-view">
            <GroupMembersControls groupId={groupId} />
            <GroupMembersList descriptor={descriptor} groupId={groupId} params={params}/>
        </div>
    )
}

export default GroupMembersView 
