import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { patchAuthentication, cleanupRequest as cleanupAuthenticationRequest } from '/state/authentication'
import { patchUser, cleanupRequest } from '/state/users'

import Spinner from '/components/Spinner'
import Input from '/components/generic/input/Input'

import './ResetPasswordForm.css'

const ResetPasswordForm = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================

    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')

    const [passwordError, setPasswordError] = useState(null)
    const [passwordConfirmationError, setPasswordConfirmationError] = useState(null)

    // ======= Request Tracking =====================================

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Actions and Event Handling ===========================

    const dispatch = useDispatch()

    /**
     * Perform validation on our state and return a boolean indicating whether
     * our current state is valid.
     *
     * @param {string} field    (Optional) When included, we'll only validate
     * the named field.  If excluded, we'll validate all fields.
     *
     * @return {boolean}    True if our state (or the named field) is valid,
     * false otherwise.
     */
    const isValid = function(field) {
        let error = false 

        if ( ! field || field == 'newPassword' ) {
            if ( ! newPassword || newPassword.length == 0 ) {
                setPasswordError('no-password')
                error = true
            } else if ( newPassword.length < 16 ) {
                setPasswordError('password-too-short')
                error = true
            } else if ( newPassword.length > 256 ) {
                setPasswordError('password-too-long')
                error = true
            } else if ( passwordError ) {
                setPasswordError(null)
            }
        }

        if ( ! field || field =='confirmNewPassword' ) {
            if (newPassword != confirmNewPassword) {
                setPasswordConfirmationError('password-mismatch')
                error = true 
            } else if ( passwordConfirmationError ) {
                setPasswordConfirmationError(null)
            }
        }

        return ! error
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        // ResetPasswordPage will check to ensure we have a token.  By the time
        // we're here, we should have one.
        const token = searchParams.get('token')

        const user = {
            id: currentUser.id,
            password: newPassword,
            token: token
        }

        setRequestId(dispatch(patchUser(user)))
    }

    // ======= Effect Handling ======================================

    // Clean up our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    // ======= Render ===============================================

    let passwordErrorView = null
    let passwordConfirmationErrorView = null

    if ( passwordError && passwordError == 'no-password') {
        passwordErrorView = ( <>Password is required!</> )
    } else if ( passwordError && passwordError == 'password-too-short') {
        passwordErrorView = (<>Your password is too short.  Please choose a password at least 16 characters in length.  We recommend the XKCD method of passphrase selection: <a href="https://xkcd.com/936/">XKCD #936: Password Strength</a>.</> )
    } else if ( passwordError && passwordError == 'password-too-long') {
        passwordErrorView = (<>Your password is too long. Limit is 256 characters.</>)
    }

    if ( passwordConfirmationError && passwordConfirmationError == 'password-mismatch' ) {
        passwordConfirmationErrorView = ( <>Your passwords don't match!</> )
    }

    let content = (
        <form onSubmit={onSubmit}>
            <div className="instructions">Please enter a new password for your Communities account.</div> 
            <Input
                name="new-password"
                label="New Password"
                explanation="Enter a new password.  It must be at least 16 characters long."
                type="password"
                value={newPassword}
                onBlur={ (event) => isValid('newPassword') }
                onChange={(event) => setNewPassword(event.target.value)}
                error={passwordErrorView} />
            <Input
                name="confirm-new-password"
                label="Confirm New Password"
                explanation="Please enter your new password again to confirm it."
                type="password"
                value={confirmNewPassword}
                onBlur={ (event) => isValid('confirmNewPassword') }
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                error={passwordConfirmationErrorView} />

            <div className="submit">
                <input type="submit" name="submit" value="Reset Password" />                    
            </div>
        </form>

    )

    if ( request && request.state == 'in-progress') {
        content = ( <Spinner local={true} /> )
    }

    else if ( request && request.state == 'fulfilled' ) {
        content = (
            <div className="success">
               We have logged you in and reset your password.  You can return to the homepage <a href="/">here</a>. 
            </div>
        )
    } 

    else if ( request && request.state == 'failed' ) {
        content = (
            <div className="request-failure">
                <p>
                    Something went wrong with the attempt to reset your
                    password.  You can try again by going back to the <a
                    href="/reset-password-request">reset password</a> page and
                    requesting a new link.
                </p>
                <p>
                    If the error persists, please report a bug.
                </p>
            </div>
        )
    }

    return (
        <div className="reset-password-form">
            { content }
        </div>   
    )
}

export default ResetPasswordForm
