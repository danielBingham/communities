import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/solid'

import can, { Actions, Entities } from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'
import { resetEntities } from '/state/lib'

import { useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { patchGroupMember } from '/state/GroupMember'

import { RequestErrorModal } from '/components/errors/RequestError'
import Button from '/components/generic/button/Button'

import './AcceptInvitationButton.css'

const AcceptInvitationButton = function({ groupId, userId }) {
    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const context = useGroupPermissionContext(currentUser, groupId)
    const group = context.group
    const currentMember = context.userMember

    const [ member ]  = useGroupMember(groupId, userId)

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)

    const dispatch = useDispatch()

    const acceptInvite = () => {
        const groupMember = {
            groupId: groupId,
            userId: userId,
            status: 'member'
        }
        makeRequest(patchGroupMember(groupMember))
    }

    useEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            dispatch(resetEntities())
        }
    }, [ request ])

    if ( ! currentUser || ! group ) {
        return null
    }

    if ( canViewGroup !== true ) {
        return null
    }

    if ( userId == currentUser.id && member && member.status === 'pending-invited') {
        return (
            <>
                <RequestErrorModal message="Attempt to accept invitation" request={request} />  
                <Button type="primary" onClick={() => acceptInvite()}><ArrowLeftEndOnRectangleIcon /> <span className="nav-text">Accept</span></Button>
            </>
        )
    } else {
        return null
    }
}

export default AcceptInvitationButton 
