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

import { clearMultifactorSecret, clearMultifactorRecoveryCodes, patchAuthentication } from '/state/authentication'
import { patchUser } from '/state/User'

import Input from '/components/ui/Input'
import Button from '/components/ui/Button'
import Alert from '/components/ui/Alert'
import Spinner from '/components/Spinner'
import Card from '/components/ui/Card'

import { MultifactorAuthenticationSecret } from '/components/authentication/MultifactorAuthentication'

import "./UserAccountSetupMultifactorAuthentication.css"

const State = {
    Disabled: 'disabled',
    Initializing: 'initializing',
    PendingAppConfiguration: 'pending-app-configuration',
    Confirming: 'confirming',
    Enabled: 'enabled',
    ErrorInitializing: 'error-initializing',
    ErrorConfirming: 'error-confirming'
}


const UserAccountSetupMultifactorAuthentication = function() {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const secret = useSelector((state) => state.authentication.multifactorSecret)
    const codes = useSelector((state) => state.authentication.multifactorRecoveryCodes)

    const [ confirmationToken, setConfirmationToken] = useState('')

    const [ patchUserRequest, makePatchUserRequest, resetPatchUserRequest ] = useRequest()
    const [ patchAuthenticationRequest, makePatchAuthenticationRequest, resetPatchAuthenticationRequest ] = useRequest()

    const dispatch = useDispatch()

    const enable = function() {
        makePatchUserRequest(patchUser({ id: currentUser.id, authenticationMultifactorState: 'pending' }))
    }

    const disable = function() {
        makePatchUserRequest(patchUser({ id: currentUser.id, authenticationMultifactorState: 'disabled' }))
    }

    const confirm = function() {
        makePatchAuthenticationRequest(patchAuthentication(confirmationToken))
    }

    const clearSecrets = function() {
        dispatch(clearMultifactorSecret())
        dispatch(clearMultifactorRecoveryCodes())
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
            clearSecrets()
        }
    }, [])

    let state = State.Disabled 
    if ( patchUserRequest?.state === 'pending' ) {
        state = State.Initializing
    } else if ( patchUserRequest?.state === 'failed' ) {
        state = State.ErrorInitializing
    } else if ( patchAuthenticationRequest?.state === 'pending' ) {
        state = State.Confirming
    } else if ( patchAuthenticationRequest?.state === 'failed' ) {
        state = State.ErrorConfirming
    } else if ( currentUser.authenticationMultifactorState === 'pending' ) {
        state = State.PendingAppConfiguration
    } else if ( currentUser.authenticationMultifactorState === 'enabled' ) {
        state = State.Enabled
    }

    return (
        <div className="user-account-setup-multifactor-authentication">
            { (state === State.Disabled || state === State.ErrorInitializing) &&
                <div className="user-account-setup-multifactor-authentication__is-disabled">
                    { state === State.ErrorInitializing && <Alert type="error" timeout={5000} onClear={() => disable()}>Failed to initialize multi-factor authentication.</Alert> }
                    <h2>Setup Multifactor Authentication</h2>
                    <p>
                        Multifactor Authentication (MFA) allows you to secure your
                        account with an authenticator app (Proton Authenticator,
                        Google Authenticator, etc) that runs
                        on a separate device you control. It provides strong
                        protection against account hacking and theft.
                    </p>
                    <p>
                        MFA requires you to enter a six digit code from your
                        authenticator app on every log in attempt. You will not
                        be able to log in without either that code or one of
                        the recovery codes provided at setup time.
                    </p>
                    <p> 
                         Click the button below to begin the MFA setup process.
                    </p>
                    <div className="user-account-setup-multifactor-authentication__controls">
                        <Button type="primary" onClick={() => enable()}>Setup Multifactor Authentication</Button>
                    </div>
                </div>
            }
            { state === State.Initializing && 
                <div className="user-account-setup-multifactor-authentication__initializing">
                    <Spinner />
                </div>
            }
            { (state === State.PendingAppConfiguration || state === State.ErrorConfirming ) &&
                <div className="user-account-setup-multifactor-authentication__is-pending">
                    <h2>Configure Your MFA Device</h2>
                    { state === State.ErrorConfirming && <Alert type="error" timeout={5000} onClear={() => resetPatchAuthenticationRequest() }>Failed to confirm your setup. Did you enter the correct code?</Alert> }
                    <MultifactorAuthenticationSecret />
                    <div className="user-account-setup-multifactor-authentication__confirmation">
                        <Input 
                            name="confirmation" 
                            label="Enter Your 6 Digit Code" 
                            explanation="Enter the 6 digit code from your authenticator app to complete your multi-factor authentication setup." 
                            className="user-account-setup-multifactor-authentication__confirmation-input"
                            value={confirmationToken}
                            autocomplete="off"
                            onChange={(e) => setConfirmationToken(e.target.value)}
                        />
                        <div className="user-account-setup-multifactor-authentication__controls">
                            <Button type="warn" onClick={() => disable()}>Cancel Setup</Button>
                            <Button type="primary" onClick={() => confirm()}>Confirm Setup</Button>
                        </div>
                    </div>
                </div>
            }
            { state === State.Confirming && 
                <div className="user-account-setup-multifactor-authentication__confirming">
                    <Spinner />
                </div>
            }
            { state === State.Enabled && codes &&
                <div className="user-account-setup-multifactor-authentication__save-codes">
                    <h2>Save Your Recovery Codes</h2>
                    <Card className="user-account-setup-multifactor-authentication__codes-card">
                        <div className="user-account-setup-multifactor-authentication__codes">
                            { codes.map((code) => <div key={code} className="user-account-setup-multifactor-authentication__code">{ code }</div>) }
                        </div>
                    </Card>
                    <p>
                        These are single use recovery codes that will allow you
                        to recover your account if you lose your MFA device.
                        Please save them somewhere secure.
                    </p>
                    <div className="user-account-setup-multifactor-authentication__controls">
                        <Button type="primary" onClick={() => clearSecrets()}>Complete Setup</Button>
                    </div>
                </div>
            }
            { state === State.Enabled && ! codes &&
                <div className="user-account-setup-multifactor-authentication__enabled">
                    <h2>Multifactor Authentication</h2>
                    <p>Multifactor Authentication is configured!</p>
                    <p>If you need to regenerate your recovery codes, please disable and then re-enable MFA.</p>
                    <div className="user-account-setup-multifactor-authentication__controls">
                        <Button type="warn" onClick={() => disable()}>Disable Multifactor Authentication</Button>
                    </div>
                </div>
            }
        </div>
    )

}

export default UserAccountSetupMultifactorAuthentication
