import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getUser, cleanupRequest } from '/state/users'

import UserProfileImage from '/components/users/UserProfileImage'
import FriendButton from '/components/friends/FriendButton'
import Spinner from '/components/Spinner'
import './UserBadge.css'

const UserBadge = function(props) {
    
    // ======= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        return state.users.requests[requestId]
    })

    // ======= Redux State ==========================================
    
    const user = useSelector(function(state) {
        return state.users.dictionary[props.id]
    })
    

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! user ) {
            setRequestId(dispatch(getUser(props.id)))
        }
    }, [ props.id ])

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    // ======= Render ===============================================

    if ( user ) {
        return (
            <div className="user-badge">
                <div className="badge-grid">
                    <UserProfileImage userId={user.id} />
                    <div className="details" >
                        <div className="name"><Link to={ `/${user.username}` }>{user.name}</Link></div>
                        <div className="about">{ user.about?.length > 100 ? user.about.substring(0,100).trim()+'...' : user.about }</div>
                        <FriendButton userId={user.id} />
                    </div> 
                </div>
            </div>
        )
    } else {
        return (<Spinner />)
    }

}

export default UserBadge 
