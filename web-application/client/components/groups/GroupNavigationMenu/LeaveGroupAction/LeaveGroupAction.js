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
import { useState, useEffect, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import can, { Actions, Entities } from '/lib/permission'

import { deleteGroupMember } from '/state/GroupMember'
import { resetEntities } from '/state/lib'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupPermissionContext } from '/lib/hooks/Group'

import {  NavigationSubmenuAction, SubmenuCloseContext, SubmenuIsMobileContext } from '/components/ui/NavigationMenu'
import AreYouSure from '/components/AreYouSure'
import { RequestErrorModal } from '/components/errors/RequestError'

const LeaveGroupAction = function({ groupId }) {
    const [ areYouSure, setAreYouSure ] = useState(false)

    const [request, makeRequest] = useRequest()
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [ context, requests] = useGroupPermissionContext(currentUser, groupId)

    const currentMember = context?.userMember

    const isMember = currentMember?.status === 'member'
    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)

    const isMobile = useContext(SubmenuIsMobileContext)
    const closeMenu = useContext(SubmenuCloseContext)

    const dispatch = useDispatch()

    const leaveGroup = function() {
        const groupMember = {
            groupId: groupId,
            userId: currentUser.id 
        }
        makeRequest(deleteGroupMember(groupMember))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            dispatch(resetEntities())

            if ( isMobile ) {
                closeMenu()
            }
        }
    }, [ request ])

    if ( ! isMember || canViewGroup !== true ) {
        return null
    }

    return (
        <>
            <NavigationSubmenuAction onClick={() => setAreYouSure(true)} icon="ArrowLeftStartOnRectangle" text="Leave" />
            <RequestErrorModal message="Attempt to leave group" request={request} /> 
            <AreYouSure isVisible={areYouSure} execute={() => { setAreYouSure(false); leaveGroup() }} cancel={() => setAreYouSure(false)} > 
                <p>Are you sure you want to leave this group?</p>
            </AreYouSure>
        </>

    )
}

export default LeaveGroupAction
