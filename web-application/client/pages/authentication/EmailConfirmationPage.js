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
import { useSearchParams, useNavigate } from 'react-router-dom'

import { validateToken } from '/state/tokens'

import { useRequest } from '/lib/hooks/useRequest'

import CommunitiesLogo from '/components/header/CommunitiesLogo'
import Spinner from '/components/Spinner'
import { RequestErrorModal } from '/components/errors/RequestError'

import EmailConfirmationForm from '/components/authentication/EmailConfirmationForm'

import './EmailConfirmationPage.css'

const EmailConfirmationPage = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()
    const token = searchParams.get('token')

    const [ request, makeRequest ] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const navigate = useNavigate()

    useEffect(function() {
        if ( token ) {
            makeRequest(validateToken(token, 'email-confirmation'))
        }
    }, [ token ])

    useEffect(function() {
        if ( 
             ( ! token && ! currentUser ) // No token and they aren't logged in. Just show the splash page.
                || (currentUser && currentUser.status != 'unconfirmed') // They are logged in, but they've already confirmed or haven't finished registering.
        ) {
            navigate('/')
        }
    }, [ currentUser, token ])

    if (  
        ( ! token && ! currentUser ) // No token and they aren't logged in, show a spinner until they are navigated away.
        || (currentUser && currentUser.status !== 'unconfirmed') // They are logged in, but aren't unconfirmed.  Ditto.
    ) {
        return (
            <Spinner />
        )
    }

    // If the request succeeded.  They successfully confirmed!  They should be
    // navigated away, but just in case, give them a way to navigate
    // themselves.
    if ( currentUser && currentUser.status === 'confirmed' ) {
        return (
            <div className="email-confirmation-page__success">
                <p>Thanks for confirming your email!</p>
                <p>You can return to the home page <a href="/">here</a></p>
            </div>
        )
    }

    
    return (
        <div id="email-confirmation-page">
            <div className="logo"><CommunitiesLogo /></div>
            <EmailConfirmationForm initialToken={token} />
            <RequestErrorModal message="Attempt to confirm email" request={request} />
        </div>
    )
}

export default EmailConfirmationPage
