import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { UserMinusIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { resetEntities } from '/state/lib'
import { deleteUserRelationship } from '/state/UserRelationship'

import Button from '/components/ui/Button'

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

    useEffect(function() {
        if ( request?.state === 'failed' && (request?.response.status === 404 || request?.response.status === 403) ) {
            // TODO There's probably a better way to handle this.
            // That relationship doesn't exist.  Reset entities to requery.
            dispatch(resetEntities())
        }
    }, [ request ])

    if ( ! currentUser || currentUser.id == userId) {
        return null
    }

    let text = 'Remove'
    if ( type == 'reject' ) {
        text = 'Reject'
    } else if (type == 'cancel' ) {
        text = 'Cancel'
    }

    return (
        <Button onClick={() => removeFriend()}><UserMinusIcon /> <span className="nav-text">{ text }</span></Button>
    )

}

export default RemoveFriendButton
