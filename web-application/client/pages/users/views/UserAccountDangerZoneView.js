import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { deleteUser } from '/state/User'
import { reset } from '/state/system'

import AreYouSure from '/components/AreYouSure'
import Button from '/components/generic/button/Button'
import { RequestErrorModal } from '/components/errors/RequestError'

import './UserAccountDangerZoneView.css'

const UserAccountDangerZoneView = function() {

    const [ areYouSure, setAreYouSure ] = useState(false)

    const [ request, makeRequest ] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)


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
        <div className="danger-zone-view">
            <div className="danger-zone">
                <h2>Danger Zone</h2>
                <div className="danger-zone-view__delete-your-account">
                    <div className="danger-zone-view__explanation">Delete your account. This will delete
                    all of your posts and images, as well as your profile. This cannot
                    be undone. Please be certain.</div>
                    <div className="danger-zone-view__button-wrapper">
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

export default UserAccountDangerZoneView

