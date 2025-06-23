import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUserRelationship } from '/state/UserRelationship'

import AddFriendButton from '/components/friends/controls/AddFriendButton'
import AcceptFriendButton from '/components/friends/controls/AcceptFriendButton'
import RemoveFriendButton from '/components/friends/controls/RemoveFriendButton'

const FriendButton = function({ userId }) {

    const [request, makeRequest] = useRequest()
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const relationshipId = useSelector((state) => userId && userId in state.UserRelationship.byUserId ? state.UserRelationship.byUserId[userId][currentUser.id] : null)
    const relationship = useSelector((state) => relationshipId !== null && relationshipId in state.UserRelationship.dictionary ? state.UserRelationship.dictionary[relationshipId] : null)

    useEffect(function() {
        if ( relationship === null && currentUser.id !== userId) {
            makeRequest(getUserRelationship(currentUser.id, userId))
        }
    }, [currentUser, userId, relationship])

    if ( ! currentUser || currentUser.id == userId) {
        return null
    }

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
