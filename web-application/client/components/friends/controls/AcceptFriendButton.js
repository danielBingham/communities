import React, {useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { patchUserRelationship, cleanupRequest } from '/state/userRelationships'

import Button from '/components/generic/button/Button'

import './AcceptFriendButton.css'

const AcceptFriendButton = function({ userId, type }) {

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

    const acceptFriend = function() {
        const relationship = {
            userId: userId,
            relationId: currentUser.id,
            status: 'confirmed'
        }

        setRequestId(dispatch(patchUserRelationship(relationship)))
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    return (
        <Button type="primary" onClick={() => acceptFriend()}>Accept Request</Button>     
    )

}

export default AcceptFriendButton
