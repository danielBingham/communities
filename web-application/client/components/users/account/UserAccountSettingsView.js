import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { deleteUser, cleanupRequest } from '/state/users'
import { reset } from '/state/system'

import AreYouSure from '/components/AreYouSure'
import Button from '/components/generic/button/Button'

import './UserAccountSettingsView.css'

const UserAccountSettingsView = function() {

    const [ areYouSure, setAreYouSure ] = useState(false)

    const [requestId, setRequestId] = useState(null)
    const request = useSelector((state) => requestId in state.users.requests ? state.users.requests[requestId] : null)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const deleteCurrentUser = function() {
        setAreYouSure(false)
        setRequestId(dispatch(deleteUser(currentUser)))
    }

    useEffect(function() {
        if ( request && request.state == 'fulfilled') {

            // Clear local storage so their drafts don't carry over to another
            // login session.
            localStorage.clear()

            dispatch(reset())

            // As soon as we reset the redux store, we need to redirect to
            // the home page.  We don't want to go through anymore render
            // cycles because that could have undefined impacts.
            window.location.href = "/"
        }
    }, [ request ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({requestId: requestId}))
            }
        }
    }, [ requestId ])

    return (
        <div className="user-settings">
            <div className="danger-zone">
                <h2>Danger Zone</h2>
                <div className="delete-your-account">
                    <div className="explanation">Delete your account. This will delete
                    all of your posts and images, as well as your profile. This cannot
                    be undone. Please be certain.</div>
                    <div className="button-wrapper">
                        <Button type="primary-warn" onClick={(e) => setAreYouSure(true)}>Delete My Account</Button>
                    </div>
                    <AreYouSure 
                        isVisible={areYouSure} 
                        action="delete your account" 
                        execute={deleteCurrentUser} 
                        cancel={() => setAreYouSure(false)} 
                    /> 
                </div>
            </div>
        </div>
    )

}

export default UserAccountSettingsView

