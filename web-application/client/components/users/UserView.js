import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUser } from '/state/users'

import UserProfileImage from '/components/users/UserProfileImage'
import FriendButton from '/components/friends/FriendButton'

import Error404 from '/components/errors/Error404'

import './UserView.css'

const UserView = function(props) {

    // ======= Request Tracking =====================================

    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================
    
    const user = useSelector((state) => state.users.dictionary[props.id])

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( ! user ) {
            makeRequest(getUser(props.id))
        }
    }, [ user ])

    // ======= Render ===============================================

    if ( ! user && ! request ) {
        return null 
    } else if ( ! user && (request && request.state == 'pending')) {
        return null 
    } else  if ( request && request.state == 'failed' ) {
        if ( request.error.type == 'not-found' ) {
            return ( <Error404 /> )
        } else {
            return (
                <article className="user-view">
                    <div className="error">
                        <p>We encountered an error while attempting to load the user. Please report a bug.</p>
                        <p>Error type "{ request.error.type }" with message: { request.error.message }.</p>
                    </div>
                </article>
            )
        }
    } else if ( ! user && request && request.state == 'fulfilled' ) {
        return ( <Error404 /> )
    } 

    return (
        <article id={ user.id } className='user-view'>
            <UserProfileImage userId={user.id} /> 
            <div className="details">
                <div className="name"> { user.name }</div>
                <div className="friendship"><FriendButton userId={user.id} /></div>
                <div className="about"> { user.about }</div>
            </div>
        </article>
    )
}

export default UserView 
