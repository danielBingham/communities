import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'

import { getUsers, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'

import UserView from '/components/users/UserView'
import PostsByUserFeed from '/components/feeds/PostsByUserFeed'

import WelcomeNotice from '/components/notices/WelcomeNotice'
import LoginForm from '/components/authentication/LoginForm'

import './UserProfilePage.css'

const UserProfilePage = function(props) {
    const { name } = useParams()

    // ======= Request Tracking =====================================

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( ! requestId) {
            return null
        } else {
            return state.users.requests[requestId]
        }
    })

    // ======= Redux State ==========================================
   
    const id = useSelector(function(state) {
        if ( 'UserProfilePage' in state.users.queries ) {
            return state.users.queries['UserProfilePage'].list[0]
        } else {
            return null
        }
    })

    const user = useSelector(function(state) {
        if ( id !== null ) {
            return state.users.dictionary[id]
        } else {
            return null
        }
    })

    const features = useSelector((state) => state.system.features)
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ================= User Action Handling  ================================
    
    const dispatch = useDispatch()

    // ======= Effect Handling ======================================

    useEffect(function() {
        setRequestId(dispatch(getUsers('UserProfilePage', { username: name })))
    }, [ name ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    // ======= Render ===============================================

    // Protect this page so the user must be logged in.
    if ( ! currentUser ) {
        return (
            <LoginForm />
        )
    }

    if ( ! user ) {
        return (
            <Spinner />
        )
    }

    let welcomeNotice = null
    if ( '3-notices' in features && currentUser && ! currentUser.notices?.welcomeNotice ) {
        welcomeNotice = ( <WelcomeNotice /> )
    }

    return (
        <div id="user-profile-page">
            { welcomeNotice }
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
