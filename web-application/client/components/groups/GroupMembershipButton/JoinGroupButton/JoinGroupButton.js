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

const JoinGroupButton = function({ groupId, userId }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const context = useGroupPermissionContext(currentUser, groupId)
    const group = context.group
    const currentMember = context.userMember

    const [ member ]  = useGroupMember(groupId, userId)

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)

    /* ==================== When currentUser is user... ======================= */

    const joinGroup = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId,
            status: 'member',
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

    // You can only join open groups.
    if ( group.type !== 'open' && group.type !== 'private-open' && group.type !== 'hidden-open' ) {
        return null
    }

    // The member we're showing is the current user and they aren't a member of
    // the group yet.
    if ( ! member && ! currentMember && currentUser.id == userId ) {
        return (
            <> 
                
                <RequestErrorModal message={`Attempt to join group, ${group.title}, `} request={request} />
                <Button type="primary" onClick={() => joinGroup()}><ArrowLeftEndOnRectangleIcon /> <span className="nav-text">Join</span></Button>
            </>
        )
    } else {
        return null
    }
}

export default JoinGroupButton 
