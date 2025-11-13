import {  useSelector } from 'react-redux'

import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/solid'

import can, { Actions, Entities } from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'

import { useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

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

    /* ==================== When currentUser is user... ======================= */

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
