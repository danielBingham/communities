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

import can, { Actions, Entities } from '/lib/permission'

import { useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import JoinGroupButton from './JoinGroupButton'
import RequestMembershipButton from './RequestMembershipButton'

import AcceptInvitationButton from './AcceptInvitationButton'
import RejectInvitationButton from './RejectInvitationButton'
import CancelMembershipRequestButton from './CancelMembershipRequestButton'

import LeaveGroupButton from './LeaveGroupButton'

import InviteMemberButton from './InviteMemberButton'

import './GroupMembershipButton.css'

const GroupMembershipButton = function({ groupId, userId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const context = useGroupPermissionContext(currentUser, groupId)
    const group = context.group
    const currentMember = context.userMember

    const [ member ]  = useGroupMember(groupId, userId)

    const canModerateGroup = can(currentUser, Actions.moderate, Entities.Group, context)

    /* =================== When currentUser is admin... ======================== */

    if ( ! currentUser || ! group ) {
        return null
    }

    // The member we're showing is the current user and they aren't a member of
    // the group yet.
    if ( ! member && ! currentMember && currentUser.id == userId ) {
        return (
            <div className="group-membership-button"> 
                <JoinGroupButton groupId={groupId} userId={userId} />
                <RequestMembershipButton groupId={groupId} userId={userId} />
            </div>
        )
    }

    // The member we're showing is current user and they are a member, have a
    // pending invite, or have pending request.
    if ( userId == currentUser.id && member ) {
        return (
            <div className="group-membership-button">
                <AcceptInvitationButton groupId={groupId} userId={userId} />
                <RejectInvitationButton groupId={groupId} userId={userId} />
                <CancelMembershipRequestButton groupId={groupId} userId={userId} />
                <LeaveGroupButton groupId={groupId} userId={userId} />
            </div>
        )
    }

    if ( currentUser.id !== userId  && canModerateGroup ) {
        return (
            <div className="group-membership-button">
                <InviteMemberButton groupId={groupId} userId={userId} />
            </div>
        ) 
    } 


    return null
}

export default GroupMembershipButton 
