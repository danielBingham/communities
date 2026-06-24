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
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { clearMultifactorSecret, patchAuthentication } from '/state/authentication'
import { patchUser } from '/state/User'

import Input from '/components/ui/Input'
import Button from '/components/ui/Button'

import { MultifactorAuthenticationSecret } from '/components/authentication/MultifactorAuthentication'

import "./UserAccountSetupMultifactorAuthentication.css"

const UserAccountSetupMultifactorAuthentication = function() {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const secret = useSelector((state) => state.authentication.multifactorSecret)

    const [ confirmationToken, setConfirmationToken] = useState('')

    const [ request, makeRequest ] = useRequest()

    const dispatch = useDispatch()

    const enable = function() {
        makeRequest(patchUser({ id: currentUser.id, authenticationMultifactorState: 'pending' }))
    }

    const disable = function() {
        makeRequest(patchUser({ id: currentUser.id, authenticationMultifactorState: 'disabled' }))
    }

    const confirm = function() {

    }

    useEffect(() => {
        // If the currentUser is in a pending state and we don't have a secret
        // on first render, then they refreshed the page mid setup and have no
        // way to retrieve the secret again to complete the setup. They're
        // going to have to cancel it, so lets cancel it for them so they can
        // restart.
        //
        // We only want to run this check on initial load with the values of
        // currentUser and secret at initial load.
        if ( currentUser?.authenticationMultifactorState === 'pending' && ( secret === null || secret === undefined )) {
            disable()
        }

        return () => {
            dispatch(clearMultifactorSecret())
        }
    }, [])

    return (
        <div className="user-account-setup-multifactor-authentication">
            { currentUser.authenticationMultifactorState === 'disabled' && 
                <div className="user-account-setup-multifactor-authentication__is-disabled">
                    <h1>Multifactor Authentication Setup</h1>
                    <p>
                        Multifactor Authentication allows you to secure your
                        account with an authenticator app (such as Google
                        Authenticator or Proton Authenticator, etc) that runs
                        on a separate device you control. It provides strong
                        protection against account hacking and theft.
                    </p>
                    <p>
                        Multifactor Authentication requires you to enter a six
                        digit code from your authenticator app on every log in
                        attempt. You will not be able to log in without either
                        that code or one of the backup codes provided at setup
                        time.
                    </p>
                    <p>
                        We do not currently provide a backup system allowing
                        you to recover your account if you lose your
                        authenticator device, other than the backup codes you
                        will be provided with during the setup process. Make
                        sure you store those codes in a secure and accessible
                        location (like a password manager). 
                    </p>
                    <p> 
                         Click the button below to begin the setup process.
                    </p>
                    <div className="user-account-setup-multifactor-authentication__controls">
                        <Button type="primary" onClick={() => enable()}>Setup Multifactor Authentication</Button>
                    </div>
                </div>
            }
            { currentUser.authenticationMultifactorState === 'pending' &&
                <div className="user-account-setup-multifactor-authentication__is-pending">
                    <MultifactorAuthenticationSecret />
                    <div className="user-account-setup-multifactor-authentication__confirmation">
                        <Input 
                            name="confirmation" 
                            label="Enter Your 6 Digit Code" 
                            explanation="Enter the 6 digit code from your authenticator app to complete your multi-factor authentication setup." 
                            className="user-account-setup-multifactor-authentication__confirmation-input"
                            value={confirmationToken}
                            onChange={(e) => setConfirmationToken(e.target.value)}
                        />
                        <div className="user-account-setup-multifactor-authentication__controls"><Button type="warn" onClick={() => disable()}>Cancel Setup</Button><Button type="primary" onClick={() => confirm()}>Confirm Setup</Button></div>
                    </div>
                </div>
            }
        </div>
    )

}

export default UserAccountSetupMultifactorAuthentication
