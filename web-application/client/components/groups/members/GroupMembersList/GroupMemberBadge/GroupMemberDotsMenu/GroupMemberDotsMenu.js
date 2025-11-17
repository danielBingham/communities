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

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { DotsMenu } from '/components/ui/DotsMenu'

import AcceptRequest from './AcceptRequest'
import BanMember from './BanMember'
import PromoteToAdmin from './PromoteToAdmin'
import PromoteToModerator from './PromoteToModerator'
import RemoveMember from './RemoveMember'


import './GroupMemberDotsMenu.css'

const GroupMemberDotsMenu = function({ groupId, userId }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [context, requests] = useGroupPermissionContext(currentUser, groupId)
    const group = context.group
    const currentMember = context.userMember

    const [userMember, userMemberRequest] = useGroupMember(groupId, userId)

    const canModerateGroup = can(currentUser, Actions.moderate, Entities.Group, context)
    const canAdminGroup = can(currentUser, Actions.admin, Entities.Group, context)

    if ( ! group || requests.hasPending() || userMemberRequest?.state === 'pending' ) {
        return null
    }

    if ( ! currentMember || (canModerateGroup !== true && canAdminGroup !== true)) {
        return null
    }

    if ( ! userMember || userMember.role === 'admin' ) {
        return null
    }

    return (
        <DotsMenu className="group-member-dots-menu">
            <PromoteToModerator groupId={groupId} userId={userId} />
            <PromoteToAdmin groupId={groupId} userId={userId} />
            <AcceptRequest groupId={groupId} userId={userId} />
            <BanMember groupId={groupId} userId={userId} />
            <RemoveMember groupId={groupId} userId={userId} />
        </DotsMenu>
        
    )
}

export default GroupMemberDotsMenu
