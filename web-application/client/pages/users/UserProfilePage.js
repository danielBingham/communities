import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers } from '/state/users'

import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import UserView from '/components/users/UserView'
import PostsByUserFeed from '/components/feeds/PostsByUserFeed'

import './UserProfilePage.css'

const UserProfilePage = function(props) {
    const { name } = useParams()

    // ======= Request Tracking =====================================

    const [ request, makeRequest ] = useRequest()

    // ======= Redux State ==========================================
  
    const id = useSelector((state) => 'UserProfilePage' in state.users.queries ? state.users.queries['UserProfilePage'].list[0] : null)
    const user = useSelector((state) => id !== null && id in state.users.dictionary ? state.users.dictionary[id] : null)

    // ================= User Action Handling  ================================

    // ======= Effect Handling ======================================

    useEffect(function() {
        makeRequest(getUsers('UserProfilePage', { username: name }))
    }, [ name ])

    // ======= Render ===============================================

    if ( ! user && ( ! request || request.state == 'pending') ) {
        return (
            <div id="user-profile-page">
                <Spinner />
            </div>
        )
    } else if ( ! user ) {
        // The request won't failed, because it's a search request.  So it will
        // just return an empty result.
        return (
            <div id="user-profile-page">
                <Error404 />
            </div>
        )
    }

    return (
        <div id="user-profile-page">
            <div className='right-sidebar'>
                <UserView id={id} />
            </div>
            <div className='main'>
                <PostsByUserFeed id={id} />
            </div>
        </div>
    )
}

export default UserProfilePage
