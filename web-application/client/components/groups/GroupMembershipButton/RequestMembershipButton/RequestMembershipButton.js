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
import {  useSelector } from 'react-redux'

import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/solid'

import can, { Actions, Entities } from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'

import { useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { postGroupMembers } from '/state/GroupMember'

import { RequestErrorModal } from '/components/errors/RequestError'
import Button from '/components/generic/button/Button'

import './RequestMembershipButton.css'

const RequestMembershipButton = function({ groupId, userId }) {
    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [context, requests] = useGroupPermissionContext(currentUser, groupId)
    const group = context.group
    const currentMember = context.userMember

    const [ member ]  = useGroupMember(groupId, userId)

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)

    const requestEntrance = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId,
            status: 'pending-requested',
            role: 'member'

        }
        makeRequest(postGroupMembers(groupId, groupMember))
    }

    if ( ! currentUser || ! group ) {
        return null
    }

    if ( canViewGroup !== true ) {
        return null
    }

    // You can only request membership in private groups.
    if ( group.type !== 'private' && group.type !== 'hidden-private' ) {
        return null
    }


    // The member we're showing is the current user and they aren't a member of
    // the group yet.
    if ( ! member && ! currentMember && currentUser.id == userId ) {
        return (
            <> 
                <RequestErrorModal message={`Attempt to request membership in ${group.title}`} request={request} />
                <Button type="primary" onClick={() => requestEntrance()}><ArrowLeftEndOnRectangleIcon /> <span className="nav-text">Request</span></Button> 
            </>
        )
    } else {
        return null
    }
}

export default RequestMembershipButton 
