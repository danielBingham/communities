import React from 'react'
import { useSelector } from 'react-redux'

import { UserMinusIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { deleteUserRelationship } from '/state/UserRelationship'

import Button from '/components/generic/button/Button'

import './RemoveFriendButton.css'

const RemoveFriendButton = function({ userId, type }) {

    const [request, makeRequest] = useRequest()
    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser || currentUser.id == userId) {
        return null
    }

    const removeFriend = function() {
        const relationship = {
            userId: userId,
            relationId: currentUser.id
        }

        makeRequest(deleteUserRelationship(relationship))
    }

    let text = 'Remove'
    if ( type == 'reject' ) {
        text = 'Reject Request'
    } else if (type == 'cancel' ) {
        text = 'Cancel Request'
    }

    return (
        <Button onClick={() => removeFriend()}><UserMinusIcon /> <span className="nav-text">{ text }</span></Button>
    )

}

export default RemoveFriendButton
