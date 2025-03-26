import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getUser } from '/state/users'

import UserProfileImage from '/components/users/UserProfileImage'
import './UserTag.css'

const UserTag = function(props) {

    // ======= Request Tracking =====================================

    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================
    
    const user = useSelector((state) => props.id in state.users.dictionary ? state.users.dictionary[props.id] : null) 

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( ! user ) {
            makeRequest(getUser(props.id))
        }
    }, [ user ])

    // ======= Render ===============================================

    return (
        <span className="user-tag" >
            { ! user && <span>{ ! props.hideProfile && <UserProfileImage /> } Anonymous</span> }
            { user && <span>{ ! props.hideProfile && <UserProfileImage userId={user.id} /> } <Link to={`/${user.username}`}>{user.name}</Link></span> }
        </span> 
    )

}

export default UserTag
