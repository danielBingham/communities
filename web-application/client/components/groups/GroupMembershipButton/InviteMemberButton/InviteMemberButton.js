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

import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/solid'

import can, { Actions, Entities } from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'

import { useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { postGroupMembers } from '/state/GroupMember'

import { RequestErrorModal } from '/components/errors/RequestError'
import Button from '/components/generic/button/Button'

import './InviteMemberButton.css'

const InviteMemberButton = function({ groupId, userId }) {
    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [ context, requests] = useGroupPermissionContext(currentUser, groupId)
    const group = context.group

    const [ member ]  = useGroupMember(groupId, userId)

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)
    const canModerateGroup = can(currentUser, Actions.moderate, Entities.Group, context)

    /* =================== When currentUser is admin... ======================== */

    /**
     * ...and user is not a member, currentUser can invite.
     */
    const invite = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId,
            status: 'pending-invited',
            role: 'member'
        }
        makeRequest(postGroupMembers(groupId, groupMember))
    }

    if ( ! currentUser || ! group ) {
        return null
    }

    if ( currentUser.id === userId ) {
        return null
    }

    if ( member !== undefined && member !== null ) {
        return null
    }

    if ( canViewGroup !== true || canModerateGroup !== true ) {
        return null
    }

    return (
        <div className="group-membership-button">
            <RequestErrorModal message="Attempt to invite member" request={request} /> 
            <Button type="primary" onClick={() => invite()}><ArrowLeftEndOnRectangleIcon /> <span className="nav-text">Invite</span></Button>
        </div>
    ) 
}

export default InviteMemberButton 
