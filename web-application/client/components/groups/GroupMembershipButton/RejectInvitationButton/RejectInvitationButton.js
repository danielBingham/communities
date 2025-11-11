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
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/solid'

import can, { Actions, Entities } from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'
import { resetEntities } from '/state/lib'

import { useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { deleteGroupMember } from '/state/GroupMember'

import { RequestErrorModal } from '/components/errors/RequestError'
import Button from '/components/generic/button/Button'

import './RejectInvitationButton.css'

const RejectInvitationButton = function({ groupId, userId }) {
    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const context = useGroupPermissionContext(currentUser, groupId)
    const group = context.group
    const currentMember = context.userMember

    const [ member ]  = useGroupMember(groupId, userId)

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)

    const dispatch = useDispatch()

    const rejectInvite = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId
        }
        makeRequest(deleteGroupMember(groupMember))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled') {
                dispatch(resetEntities())
        }
    }, [ request ])

    // ================= Render ===============================================

    if ( ! currentUser || ! group ) {
        return null
    }

    if ( canViewGroup !== true ) {
        return null
    }

    if ( userId == currentUser.id && member && member.status === 'pending-invited') {
        return (
            <>
                <RequestErrorModal message="Attempt to reject invitation" request={request} /> 
                <Button onClick={() => rejectInvite()}><ArrowLeftStartOnRectangleIcon /> <span className="nav-text">Reject</span></Button>
            </>
        )
    } else {
        return null
    }
}

export default RejectInvitationButton 
