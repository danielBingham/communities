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
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import logger from '/logger'

import { deleteUser } from '/state/User'
import { reset } from '/state/system'

import { useRequest } from '/lib/hooks/useRequest'

import CommunitiesLogo from '/components/header/CommunitiesLogo'
import Button from '/components/ui/Button'

import './AgeGate.css'

const AgeGate = function() {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [request, makeRequest] = useRequest()

    const dispatch = useDispatch()

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

    if ( currentUser ) {
        return (
            <div id="age-gate">
                <div className="logo"><CommunitiesLogo /></div>
                <p>You must be at least 18 years of age to use Communities.</p>
                <p>Your account will become available at that time. If you would like to delete your account, you can do so below.</p>
                <p>If you are older than 18 years old, please contact support by emailing contact@communities.social.</p>
                <p><Button type='warn' onClick={() => makeRequest(deleteUser(currentUser))}>Delete Account</Button></p>
            </div>
        )
    } else {
        return (
            <div id="age-gate">
                <div className="logo"><CommunitiesLogo /></div>
                <p>You must be at least 18 years of age to use Communities.</p>
                <p>Your data has been deleted. You may recreate your account when you turn 18.</p>
                <p><Button type="primary" href="/">Back to Home</Button></p>
            </div>
        )
    }

}

export default AgeGate
