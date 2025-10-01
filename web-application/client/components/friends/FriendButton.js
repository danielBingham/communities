import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useUserRelationship } from '/lib/hooks/UserRelationship'

import AddFriendButton from '/components/friends/controls/AddFriendButton'
import AcceptFriendButton from '/components/friends/controls/AcceptFriendButton'
import RemoveFriendButton from '/components/friends/controls/RemoveFriendButton'

const FriendButton = function({ userId }) {

    const [request, makeRequest] = useRequest()
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [ relationship, relationshipRequest] = useUserRelationship(currentUser?.id, userId)

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
