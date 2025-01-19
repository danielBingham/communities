import React, {useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { postUserRelationships, cleanupRequest } from '/state/userRelationships'

import Button from '/components/generic/button/Button'

import './AddFriendButton.css'

const AddFriendButton = function({ userId }) {

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

    const addFriend = function() {
        const relationship = {
            userId: currentUser.id,
            relationId: userId,
            status: 'pending'
        }

        setRequestId(dispatch(postUserRelationships(relationship)))
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    return (
         <Button type="primary" onClick={() => addFriend()}>Add Friend</Button>
    )

}

export default AddFriendButton
