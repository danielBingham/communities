import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { UserMinusIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { resetEntities } from '/state/lib'
import { deleteUserRelationship } from '/state/UserRelationship'

import Button from '/components/generic/button/Button'

import './RemoveFriendButton.css'

const RemoveFriendButton = function({ userId, type }) {

    const [request, makeRequest] = useRequest()
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dispatch = useDispatch()
    const removeFriend = function() {
        const relationship = {
            userId: userId,
            relationId: currentUser.id
        }

        makeRequest(deleteUserRelationship(relationship))
    }

    useEffect(() => {
        return () => {
            // Reset entities on unmount.  Unmount will occur when the patched
            // UserRelationship has been updated so that their state is no
            // longer pending.
            dispatch(resetEntities())
        }
    }, [])

    if ( ! currentUser || currentUser.id == userId) {
        return null
    }

    let text = 'Remove'
    if ( type == 'reject' ) {
        text = 'Reject Request'
    } else if (type == 'cancel' ) {
        text = 'Cancel Request'
    }

    return (
        <Button onClick={() => removeFriend()}><UserMinusIcon /> <span className="nav-text">{ text }</span></Button>
    )

}

export default RemoveFriendButton
