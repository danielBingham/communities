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
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/solid'

import can, { Actions, Entities } from '/lib/permission'

import { resetEntities } from '/state/lib'

import { useRequest } from '/lib/hooks/useRequest'

import { useGroupPermissionContext } from '/lib/hooks/Group'

import { postGroupMembers } from '/state/GroupMember'

import { RequestErrorModal } from '/components/errors/RequestError'
import Button from '/components/generic/button/Button'

import './JoinGroupButton.css'

const JoinGroupButton = function({ groupId }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [context, requests] = useGroupPermissionContext(currentUser, groupId)
    const group = context.group
    const currentMember = context.userMember

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)
    const canAdminGroup = can(currentUser, Actions.admin, Entities.Group, context)

    const dispatch = useDispatch()

    const joinGroup = () => {
        const groupMember = {
            groupId: groupId,
            userId: currentUser.id,
            status: 'member',
            role: 'member'
        }

        if ( canAdminGroup === true ) {
            groupMember.role = 'admin'
        }

        makeRequest(postGroupMembers(groupId, groupMember))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            dispatch(resetEntities())
        }
    }, [ request ])

    // TECHDEBT HACK: The JoinGroupButton is currently rendered in the context
    // of the GroupMembershipButton.  As soon as the request returns, the
    // GroupMembershipButton stops rendering the JoinGroupButton, which means
    // our effect above checking for request completion never gets a chance to
    // fire.  The JoinGroupButton is never rendered with a completed request.
    // As a hacky workaround for this, we can resetEntities() on component
    // unmount instead. The only times the JoinGroupButton should be unmounted
    // are a) when the request has successfully returned or b) when the page is
    // changing (at which point entities are reset anyway).  The only downside
    // to this hack is a potential extra reset/requery, but that should be
    // relatively harmless.
    useEffect(function() {
        return () => {
            dispatch(resetEntities())
        }
    }, [])

    // ========================================================================
    //      Render
    // ========================================================================

    if ( ! currentUser || ! group || requests.hasPending() ) {
        return null
    }

    if ( canViewGroup !== true ) {
        return null
    }

    // You can only join open groups, unless you are an admin by way of being an admin of a parent group.
    if ( canAdminGroup !== true && group.type !== 'open' && group.type !== 'private-open' && group.type !== 'hidden-open' ) {
        return null
    }

    if ( currentMember !== null && currentMember !== undefined ) {
        return null
    }

    return (
        <> 

            <RequestErrorModal message={`Attempt to join group, ${group.title}, `} request={request} />
            <Button type="primary" onClick={() => joinGroup()}><ArrowLeftEndOnRectangleIcon /> <span className="nav-text">Join</span></Button>
        </>
    )
}

export default JoinGroupButton 
