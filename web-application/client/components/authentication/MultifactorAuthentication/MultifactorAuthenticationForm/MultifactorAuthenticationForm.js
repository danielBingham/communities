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
import { useNavigate } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'
import { patchAuthentication, deleteAuthentication } from '/state/authentication'

import Button from '/components/ui/Button'
import Alert from '/components/ui/Alert'
import Spinner from '/components/Spinner'
import Input from '/components/ui/Input'

import './MultifactorAuthenticationForm.css'

const State = {
    PendingMultifactor: 'pending-multifactor',
    Authenticated: 'authenticated',
    Unauthenticated: 'unauthenticated',
    PendingAuthentication: 'pending-authentication',
    PendingLogout: 'pending-logout',
    AuthenticationFailed: 'authentication-failed',
    LogoutFailed: 'logout-failed'
}

const MultifactorAuthenticationForm = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const pendingUserId = useSelector((state) => state.authentication.pendingUserId)

    const [ mfaToken, setMFAToken] = useState('')
    const [ recoveryCode, setRecoveryCode ] = useState('')

    const [ validationErrors, setValidationErrors] = useState([])
    const [ needsRecovery, setNeedsRecovery] = useState(false)

    const [ patchAuthenticationRequest, makePatchAuthenticationRequest, resetPatchAuthenticationRequest ] = useRequest()
    const [ deleteAuthenticationRequest, makeDeleteAuthenticationRequest, resetDeleteAuthenticationRequest ] = useRequest()

    const navigate = useNavigate()

    const validate = function() {
        const errors = []

        if ( needsRecovery !== true ) {
            if ( mfaToken === null || mfaToken === undefined || mfaToken === '' ) {
                errors.push('Please enter your multifactor authentication token.')
                setValidationErrors(errors)
                return false
            }

            if ( mfaToken.length < 6 || mfaToken.length > 6 ) {
                errors.push('Your token must be exactly 6 characters in length.')
            }
        } else {
            if ( recoveryCode === null || recoveryCode === undefined || recoveryCode === '' ) {
                errors.push('Please enter your recovery code.')
                setValidationErrors(errors)
                return false
            }

            if ( recoveryCode.length < 14 || recoveryCode.length > 14 ) {
                errors.push('Your recovery code must be exactly 14 characters in length.')
            }
        }

        if ( errors.length > 0 ) {
            setValidationErrors(errors)
            return false
        } 

        setValidationErrors([])
        return true
    }

    const toggleRecoveryCode = function(event) {
        event.preventDefault()
        event.stopPropagation()

        resetPatchAuthenticationRequest()
        resetDeleteAuthenticationRequest()

        setNeedsRecovery( ! needsRecovery)
    }

    const logout = function() {
        makeDeleteAuthenticationRequest(deleteAuthentication())
    }

    const submit = function() {
        if ( ! validate() ) {
            return
        }

        if ( needsRecovery === true ) {
            makePatchAuthenticationRequest(patchAuthentication(null, recoveryCode))
        } else {
            makePatchAuthenticationRequest(patchAuthentication(mfaToken))
        }
    }

    const onKeyUp = function(event) {
        if ( event.key === 'Enter' ) {
            submit()
        }
    }

    // ===================== Render ===========================================

    let state = State.PendingMultifactor

    // We don't want to show the token form when the user is fully
    // authenticated.
    if ( currentUser !== null && currentUser !== undefined ) {
        state = State.Authenticated
    }

    // We don't want to show the token form if the user isn't at least
    // partially authenticated.
    else if ( pendingUserId === null || pendingUserId === undefined ) {
        state = State.Unauthenticated
    }

    else if ( patchAuthenticationRequest?.state === 'pending' ) {
        state = State.PendingAuthentication
    }

    else if ( patchAuthenticationRequest?.state === 'failed' ) {
        state = State.AuthenticationFailed
    }

    else if ( deleteAuthenticationRequest?.state === 'pending' ) {
        state = State.PendingLogout
    }

    else if ( deleteAuthenticationRequest?.state === 'failed' ) {
        state = State.LogoutFailed
    }

    return (
        <div className="multifactor-authentication-form">
            <h2>Multifactor Authentication</h2>
            { state === State.Authenticated && 
                <>
                    <p>You have successfully logged in.</p>
                    <Button type="primary" onClick={() => navigate("/")}>Continue</Button>
                </>
            }
            { state === State.Unauthenticated && 
                <>
                    <p>You must log in before entering your authentication token.</p>
                    <Button type="primary" onClick={() => navigate("/")}>Continue</Button>
                </>
            }
            { ( state === State.PendingAuthentication || state === State.PendingLogout ) &&
                <>
                    <Spinner />
                </>
            }
            { ( state === State.PendingMultifactor || state === State.AuthenticationFailed || state === State.LogoutFailed) && needsRecovery !== true && 
                <>
                    { state === State.AuthenticationFailed && <Alert type="error" timeout={5000} onClear={() => resetPatchAuthenticationRequest()}>Authentication failed.  Did you enter the correct token?</Alert> }
                    { state === State.LogoutFailed && <Alert type="error" timeout={5000} onClear={() => resetDeleteAuthenticationRequest()}>Logout failed.  This is probably a network error. Check your connection and try again!</Alert>}
                    <Input 
                        name="mfa" 
                        label="Enter Your 6 Digit Code" 
                        explanation="Enter the 6 digit code from your authenticator app finish logging in." 
                        className="multifactor-authentication-form__token"
                        value={mfaToken}
                        maxLength={6}
                        onKeyUp={onKeyUp}
                        autocomplete={"off"}
                        error={validationErrors}
                        onChange={(e) => setMFAToken(e.target.value)}
                    />
                    <div className="multifactor-authentication-form__backup-code">
                        <p>Lost your authentication device?  Enter a <a href="#" onClick={(e) => toggleRecoveryCode(e)}>recovery code</a>.</p>
                    </div>
                    <div className="multifactor-authentication-form__controls">
                        <Button type="warn" onClick={() => logout()}>Cancel</Button>
                        <Button type="primary" onClick={() => submit()}>Confirm</Button>
                    </div>
                </>
            }
            { ( state === State.PendingMultifactor || state === State.AuthenticationFailed || state === State.LogoutFailed) && needsRecovery === true && 
                <>
                    { state === State.AuthenticationFailed && <Alert type="error" timeout={5000} onClear={() => resetPatchAuthenticationRequest()}>Authentication failed.  Did you enter the correct recovery code?</Alert> }
                    { state === State.LogoutFailed && <Alert type="error" timeout={5000} onClear={() => resetDeleteAuthenticationRequest()}>Logout failed.  This is probably a network error. Check your connection and try again!</Alert>}
                    <Input 
                        name="recovery" 
                        label="Enter Your Recovery Code" 
                        explanation="Enter your recovery code to log in." 
                        className="multifactor-authentication-form__recovery-code"
                        value={recoveryCode}
                        maxLength={14}
                        onKeyUp={onKeyUp}
                        autocomplete={"off"}
                        error={validationErrors}
                        onChange={(e) => setRecoveryCode(e.target.value)}
                    />
                    <div className="multifactor-authentication-form__backup-code">
                        <p>Have an authentication device?  Enter an <a href="#" onClick={(e) => toggleRecoveryCode(e)}>MFA token</a>.</p>
                    </div>
                    <div className="multifactor-authentication-form__controls">
                        <Button type="warn" onClick={() => logout()}>Cancel</Button>
                        <Button type="primary" onClick={() => submit()}>Confirm</Button>
                    </div>
                </>
            }
        </div>
    )


}

export default MultifactorAuthenticationForm
