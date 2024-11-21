import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getUsers, cleanupRequest } from '/state/users'

import UserBadge from '/components/users/UserBadge'
import UserInvite from '/components/users/input/UserInvite' 

import './YourFriendsList.css'

const YourFriendsList = function() {

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.users.requests ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const query = useSelector(function(state) {
        if ( 'YourFriendsList' in state.users.queries) {
            return state.users.queries['YourFriendsList']
        } else {
            return null
        }
    })

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getUsers('YourFriendsList', { friendOf: currentUser.id })))
    }, [])

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])

    const userViews = []
    if ( query ) {
        for ( const userId of query.list ) {
            userViews.push(<UserBadge key={userId} id={userId} />)
        }
    }

    return (
        <div className="your-friends-list">
            <UserInvite />
            <div className="friends-grid">
            { userViews }
            </div>
        </div>
    )
}

export default YourFriendsList
