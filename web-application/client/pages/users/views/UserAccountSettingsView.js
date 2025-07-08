import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { deleteUser } from '/state/User'
import { reset } from '/state/system'

import AreYouSure from '/components/AreYouSure'
import Button from '/components/generic/button/Button'
import { RequestErrorModal } from '/components/errors/RequestError'

import NotificationSettingsSection from '/components/users/account/sections/NotificationSettingsSection'

import './UserAccountSettingsView.css'

const UserAccountSettingsView = function() {

    const [ areYouSure, setAreYouSure ] = useState(false)
    const [ toggled, setToggled ] = useState(false)

    const [ request, makeRequest ] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const features = useSelector((state) => state.system.features)

    const hasNotificationSettings = '1-notification-settings' in features && features['1-notification-settings'].status === 'enabled'

    const dispatch = useDispatch()

    const deleteCurrentUser = function() {
        setAreYouSure(false)
        makeRequest(deleteUser(currentUser))
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

    return (
        <div className="user-settings">
            { hasNotificationSettings && <NotificationSettingsSection />}
            <div className="danger-zone">
                <h2>Danger Zone</h2>
                <div className="user-settings__delete-your-account">
                    <div className="user-settings__explanation">Delete your account. This will delete
                    all of your posts and images, as well as your profile. This cannot
                    be undone. Please be certain.</div>
                    <div className="user-settings__button-wrapper">
                        <Button type="warn" onClick={(e) => setAreYouSure(true)}>Delete My Account</Button>
                    </div>
                    <AreYouSure isVisible={areYouSure} execute={deleteCurrentUser} cancel={() => setAreYouSure(false)} > 
                        <p>Are you sure you want to delete your account?</p>
                    </AreYouSure>
                </div>
                <RequestErrorModal message="Attempt to delete account" request={request} />
            </div>
        </div>
    )

}

export default UserAccountSettingsView

