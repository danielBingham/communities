/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import logger from '/logger'

import { isLocalStorageAvailable } from '/lib/localStorage'
import { useRequest } from '/lib/hooks/useRequest'
import { deleteUser } from '/state/User'
import { reset } from '/state/system'

import AreYouSure from '/components/AreYouSure'
import Button from '/components/ui/Button'
import { RequestErrorModal } from '/components/errors/RequestError'

import NotificationSettingsSection from '/components/users/account/sections/NotificationSettingsSection'

import './UserAccountSettingsView.css'

const UserAccountSettingsView = function() {

    const [ areYouSure, setAreYouSure ] = useState(false)
    const [ toggled, setToggled ] = useState(false)

    const [ request, makeRequest ] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dispatch = useDispatch()

    const deleteCurrentUser = function() {
        setAreYouSure(false)
        makeRequest(deleteUser(currentUser))
    }

    useEffect(function() {
        if ( request && request.state == 'fulfilled') {

            if ( isLocalStorageAvailable() ) {
                try { 
                    // Clear local storage so their drafts don't carry over to another
                    // login session.
                    localStorage.clear()
                } catch (error) {
                    logger.error(error)
                }
            }

            dispatch(reset())

            // As soon as we reset the redux store, we need to redirect to
            // the home page.  We don't want to go through anymore render
            // cycles because that could have undefined impacts.
            window.location.href = "/"
        }
    }, [ request ])

    return (
        <div className="user-settings">
            <NotificationSettingsSection />
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

