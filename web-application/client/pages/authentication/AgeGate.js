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
import { useSelector } from 'react-redux'

import logger from '/logger'

import { deleteUser } from '/state/User'

import { useRequest } from '/lib/hooks/useRequest'

import CommunitiesLogo from '/components/header/CommunitiesLogo'
import Button from '/components/ui/Button'

import './AgeGate.css'

const AgeGate = function() {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [request, makeRequest] = useRequest()

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
                <p>When you turn 18 years old, you will be about to use your account.</p>
                <p>If you are older than 18 years old, please <a href="/about/contact">contact support</a>.</p>
                <p><Button type='warn' onClick={() => logout()}>Delete Account</Button></p>
            </div>
        )
    }

}

export default AgeGate
