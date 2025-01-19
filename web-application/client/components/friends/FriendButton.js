import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getUserRelationship,  cleanupRequest } from '/state/userRelationships'

import AddFriendButton from '/components/friends/controls/AddFriendButton'
import AcceptFriendButton from '/components/friends/controls/AcceptFriendButton'
import RemoveFriendButton from '/components/friends/controls/RemoveFriendButton'

const FriendButton = function({ userId }) {

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

    const relationshipId = useSelector((state) => userId in state.userRelationships.byUserId ? state.userRelationships.byUserId[userId][currentUser.id] : null)
    const relationship = useSelector((state) => relationshipId !== null && relationshipId in state.userRelationships.dictionary ? state.userRelationships.dictionary[relationshipId] : null)

    const dispatch = useDispatch()

    useEffect(function() {
        if ( relationship === null ) {
            setRequestId(dispatch(getUserRelationship(currentUser.id, userId))) 
        }
    }, [currentUser, userId, relationship])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    let content = null
    if ( ! relationship) {
        content = (<AddFriendButton userId={userId} />)
    } else if (relationship && relationship.userId == currentUser.id && relationship.status == 'pending' ) {
        content = (<RemoveFriendButton userId={userId} type="cancel" />)
    } else if ( relationship && relationship.relationId == currentUser.id && relationship.status == 'pending' ) {
        content = (
            <div>
                <AcceptFriendButton userId={userId} /> 
                <RemoveFriendButton userId={userId} type="reject" /> 
            </div>
        )
    } else if ( relationship && relationship.status == 'confirmed' ) {
        content = (
            <RemoveFriendButton userId={userId} type="remove" /> 
        )
    }

    return (
        <>
            { content }
        </>
    )

}

export default FriendButton
