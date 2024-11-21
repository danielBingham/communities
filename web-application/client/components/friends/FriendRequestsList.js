import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getUsers, cleanupRequest } from '/state/users'

import UserBadge from '/components/users/UserBadge'

const FriendRequestsList = function() {

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.users.requests ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const query = useSelector(function(state) {
        if ( 'FriendRequestsList' in state.users.queries) {
            return state.users.queries['FriendRequestsList']
        } else {
            return null
        }
    })

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const friends = useSelector((state) => state.authentication.friends)

    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getUsers('FriendRequestsList', { friendOf: currentUser.id })))
    }, [])

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])

    const userViews = []
    if ( query ) {
        for ( const userId of query.list ) {
            if ( friends.find((f) => (f.userId == userId || f.friendId == userId) && f.status == 'pending') ) {
                userViews.push(<UserBadge key={userId} id={userId} />)
            }
        }
    }

    return (
        <div className="your-friends-list">
            { userViews }
        </div>
    )
}

export default FriendRequestsList
