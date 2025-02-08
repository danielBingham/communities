import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUserRelationship } from '/state/userRelationships'

import AddFriendButton from '/components/friends/controls/AddFriendButton'
import AcceptFriendButton from '/components/friends/controls/AcceptFriendButton'
import RemoveFriendButton from '/components/friends/controls/RemoveFriendButton'

const FriendButton = function({ userId }) {

    const [request, makeRequest] = useRequest()
    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser || currentUser.id == userId) {
        return null
    }

    const relationshipId = useSelector((state) => userId && userId in state.userRelationships.byUserId ? state.userRelationships.byUserId[userId][currentUser.id] : null)
    const relationship = useSelector((state) => relationshipId !== null && relationshipId in state.userRelationships.dictionary ? state.userRelationships.dictionary[relationshipId] : null)

    useEffect(function() {
        if ( relationship === null ) {
            makeRequest(getUserRelationship(currentUser.id, userId))
        }
    }, [currentUser, userId, relationship])

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
