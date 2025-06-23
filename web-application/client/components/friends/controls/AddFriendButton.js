import React from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { postUserRelationships } from '/state/UserRelationship'

import Button from '/components/generic/button/Button'

import './AddFriendButton.css'

const AddFriendButton = function({ userId }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser || currentUser.id == userId) {
        return null
    }

    const addFriend = function() {
        const relationship = {
            userId: currentUser.id,
            relationId: userId,
            status: 'pending'
        }

        makeRequest(postUserRelationships(relationship))
    }

    return (
         <Button type="primary" onClick={() => addFriend()}>Add Friend</Button>
    )

}

export default AddFriendButton
