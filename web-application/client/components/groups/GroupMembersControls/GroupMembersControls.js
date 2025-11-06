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

import { useGroup, useGroupPermissionContext } from '/lib/hooks/Group'

import Button from '/components/ui/Button'

import './GroupMembersControls.css'

const GroupMembersControls = function({ groupId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const context = useGroupPermissionContext(currentUser, groupId)
    const group = context.group

    const canModerateGroup = can(currentUser, Actions.moderate, Entities.Group, context)

    if ( ! canModerateGroup ) {
        return null
    }

     return (
         <div className="group-members-controls">
             <Button href={`/group/${group.slug}/invite`} type="primary">Invite Friends</Button>
             <Button href={`/group/${group.slug}/email-invite`} type="primary">Invite by Email</Button>
         </div> 
    )
}

export default GroupMembersControls
