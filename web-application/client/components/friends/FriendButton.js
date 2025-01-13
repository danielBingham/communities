import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { postFriends, patchFriend, deleteFriend, cleanupRequest } from '/state/users'

import Button from '/components/generic/button/Button'

const FriendButton = function({ userId }) {

    const [requestId,setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.users.requests ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const friends = useSelector((state) => state.authentication.friends)

    const dispatch = useDispatch()

    const addFriend = function() {
        const relationship = {
            userId: currentUser.id,
            friendId: userId,
            status: 'pending'
        }

        setRequestId(dispatch(postFriends(relationship)))
    }

    const acceptFriend = function() {
        const relationship = {
            userId: userId,
            friendId: currentUser.id,
            status: 'confirmed'
        }

        setRequestId(dispatch(patchFriend(relationship)))
    }

    const rejectFriend = function() {
        const relationship = {
            userId: userId,
            friendId: currentUser.id
        }

        setRequestId(dispatch(deleteFriend(relationship)))
    }

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])

    if ( userId == currentUser.id ) {
        return null
    }


    const friend = friends.find((f) => f.userId == userId || f.friendId == userId)

    let content = null
    if ( ! friend ) {
        content = (<Button type="primary" onClick={() => addFriend()}>Add Friend</Button>)
    } else if (friend && friend.userId == currentUser.id && friend.status == 'pending' ) {
        content = (<Button type="secondary-warn" onClick={() => rejectFriend()}>Cancel Request</Button>)
    } else if ( friend && friend.friendId == currentUser.id && friend.status == 'pending' ) {
        content = (
            <div>
                <Button type="primary" onClick={() => acceptFriend()}>Accept Request</Button> 
                <Button type="secondary" onClick={() => rejectFriend()}>Reject Request</Button>
            </div>
        )
    } else if ( friend && friend.status == 'confirmed' ) {
        content = (
            <Button type="secondary-warn" onClick={() => rejectFriend()}>Remove</Button>
        )
    }

    return (
        <>
            { content }
        </>
    )

}

export default FriendButton
