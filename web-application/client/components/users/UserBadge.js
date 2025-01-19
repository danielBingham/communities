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
    if( ! user && ( ! request || request.status == 'pending' )) {
        return (<div className="user-badge"> <Spinner local={true} /></div>)
    }

    // TECHDEBT: The request will return a 404 not found in certain circumstances
    // where someone has a userId (through a relationship gained through an
    // invite, for example), but a user hasn't finished registering and
    // confirmed yet.  In those circumstances, the FriendList will create a
    // user badge with the ID, but the GET /user/:id endpoint will return 404
    // because of the unconfirmed status.
    //
    // In that case, we'll just return null for now.
    if ( user ) {
        return (
            <div className="user-badge">
                <div className="user-badge__grid">
                    <UserProfileImage userId={user.id} />
                    <div className="user-badge__details" >
                        <div className="user-badge__name"><Link to={ `/${user.username}` }>{user.name}</Link></div>
                        <div className="user-badge__about">{ user.about?.length > 100 ? user.about.substring(0,100).trim()+'...' : user.about }</div>
                        <FriendButton userId={user.id} />
                    </div> 
                </div>
            </div>
        )
    } else {
        return (null)
    }

}

export default UserBadge 
