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
import { useState } from 'react'
import { useSelector } from 'react-redux'

import { CheckCircleIcon } from '@heroicons/react/24/outline'

import { validateToken } from '/state/tokens'

import { useRequest } from '/lib/hooks/useRequest'

import { RequestErrorModal } from '/components/errors/RequestError'
import Button from '/components/ui/Button'
import Alert from '/components/ui/Alert'

import LogoutAction from '/components/authentication/LogoutAction'
import ResendTokenAction from './ResendTokenAction'

import './EmailConfirmationForm.css'

const EmailConfirmationForm = function({ initialToken }) {
    const [token, setToken] = useState(initialToken ? initialToken : '')
    const [error, setError] = useState(false)

    const [ request, makeRequest ] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const validate = function() {
        if ( token === undefined || token === null || token.length <= 0 || typeof token !== 'string' ) {
            setError(true)
            return
        }
        makeRequest(validateToken(token, 'email-confirmation'))
    }
    
    return (
        <div className="email-confirmation-form">
            { error && <Alert type="error" timeout={5000}>That token was invalid.  Please enter a valid token.</Alert> }
            <div className="email-confirmation-form__instructions">
                <p>
                    Please check your email, "{ currentUser.email }", for a
                    confirmation request and follow the link within to confirm
                    your address.
                </p>
                <p>
                    It can take up to 15 minutes to arrive in your inbox.  You
                    can search for "[Communities]" to find it.  Make sure to check
                    your spam as well!
                </p>
                <p>
                    If you followed the confirmation link here and are not
                    automatically confirmed, you can paste your token below to
                    confirm:
                </p>
                <p>
                    <input 
                        type="text" 
                        name="token" 
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />

                </p>
                <LogoutAction type="button" /> <ResendTokenAction /> <Button type="primary" onClick={() => validate()}><CheckCircleIcon /> Confirm Email</Button>
                <p>
                    If you need help, don't hesitate to reach out to <a href="mailto:contact@communities.social">contact@communities.social</a>.
                </p>
                <RequestErrorModal message="Attempt to confirm email" request={request} />
            </div>
        </div>
    )
}

export default EmailConfirmationForm

