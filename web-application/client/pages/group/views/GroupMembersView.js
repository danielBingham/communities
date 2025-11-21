/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useSelector } from 'react-redux'

import can, {Actions, Entities} from '/lib/permission'

import { useGroup, useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import Spinner from '/components/Spinner'
import Button from '/components/ui/Button'

import GroupMembersControls from '/components/groups/GroupMembersControls'
import GroupMembersList from '/components/groups/members/GroupMembersList'

import './GroupMembersView.css'

const GroupMembersView = function({ groupId, type }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [ context, requests] = useGroupPermissionContext(currentUser, groupId)
    const group = context.group

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)
    const canModerateGroup = can(currentUser, Actions.moderate, Entities.Group, context)
    const canQueryGroupMember = can(currentUser, Actions.query, Entities.GroupMember, context)

    if ( group === undefined || requests.hasPending()) 
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
    } else if ( type === 'requests' && 
        ( group.type === 'private' || group.type === 'private-open' || group.type === 'hidden-private' )
    ) {
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
