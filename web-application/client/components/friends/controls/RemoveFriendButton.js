import React, {useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { deleteUserRelationship, cleanupRequest } from '/state/userRelationships'

import Button from '/components/generic/button/Button'

import './RemoveFriendButton.css'

const RemoveFriendButton = function({ userId, type }) {

    const [requestId,setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.userRelationships.requests ) {
            return state.userRelationships.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser || currentUser.id == userId) {
        return null
    }

    const dispatch = useDispatch()

    const removeFriend = function() {
        const relationship = {
            userId: userId,
            relationId: currentUser.id
        }

        setRequestId(dispatch(deleteUserRelationship(relationship)))
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    let text = 'Remove'
    if ( type == 'reject' ) {
        text = 'Reject Request'
    } else if (type == 'cancel' ) {
        text = 'Cancel Request'
    }

    return (
        <Button type="secondary-warn" onClick={() => removeFriend()}>{ text }</Button>
    )

}

export default RemoveFriendButton
