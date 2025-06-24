import React from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUserRelationship } from '/state/UserRelationship'

import Button from '/components/generic/button/Button'

import './AcceptFriendButton.css'

const AcceptFriendButton = function({ userId, type }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser || currentUser.id == userId) {
        return null
    }

    const acceptFriend = function() {
        const relationship = {
            userId: userId,
            relationId: currentUser.id,
            status: 'confirmed'
        }

        makeRequest(patchUserRelationship(relationship))
    }

    return (
        <Button type="primary" onClick={() => acceptFriend()}>Accept Request</Button>     
    )

}

export default AcceptFriendButton
