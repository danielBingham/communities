import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { validateToken } from '/state/tokens'
import { patchUser } from '/state/User'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'
import Input from '/components/ui/Input'

import './ResetPasswordForm.css'

const ResetPasswordForm = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ResetPasswordPage will check to ensure we have a token.  By the time
    // we're here, we should have one.
    const token = searchParams.get('token')

    // ======= Render State =========================================

    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')

    const [passwordValidationError, setPasswordValidationError] = useState([])
    const [passwordConfirmationValidationError, setPasswordConfirmationValidationError] = useState([])

    // ======= Request Tracking =====================================

    const [request, makeRequest] = useRequest()
    const [ tokenRequest, makeTokenRequest ] = useRequest()

    // ======= Redux State ==========================================

    const user = useSelector((state) => token in state.tokens.usersByToken ? state.tokens.usersByToken[token] : null)

    // ======= Actions and Event Handling ===========================

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
            const passwordErrors = []

            if ( ! newPassword || newPassword.length == 0 ) {
                passwordErrors.push('New password is required!')
                error = true
            } else if ( newPassword.length < 12 ) {
                passwordErrors.push('Your new password must be at least 16 characters in length.')
                error = true
            } else if ( newPassword.length > 256 ) {
                passwordErrors.push('Your new password must be less than 256 characters in length.')
                error = true
            } 

            setPasswordValidationError(passwordErrors)
        }

        if ( ! field || field =='confirmNewPassword' ) {
            const passwordConfirmationErrors = []

            if (newPassword != confirmNewPassword) {
                passwordConfirmationErrors.push('Your passwords must match!')
                error = true 
            } 

            setPasswordConfirmationValidationError(passwordConfirmationErrors)
        }

        return ! error
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }


        const userPatch = {
            id: user.id,
            password: newPassword,
            token: token
        }

        makeRequest(patchUser(userPatch))
    }

    // ======= Effect Handling ======================================
    
    useEffect(function() {
        const token = searchParams.get('token')

        makeTokenRequest(validateToken(token, 'reset-password'))
    }, [ searchParams ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            window.location.href = "/"
        }
    }, [ request ])

    // ======= Render ===============================================


    let baseError = '' 

    /**
     * Error views that we'll re-use for multiple errors.
     */
    const resetTokenInvalidView = (
        <div className="reset-password-form">
            <p>Your reset token either expired or was invalid.  Please <a
            href="/reset-password-request">request a new reset link</a>.</p>
        </div>
    )
    const loggedInErrorView = (
        <div className="reset-password-form">
            <span>You are currently logged in.  You cannot redeem another user's token.  Please return to the <a href="/">home</a> page to log out.</span>
        </div>
    )

    // If something's wrong with the token request, then we don't want to
    // render the form.
    if ( tokenRequest && tokenRequest.state == 'failed' ) {
        if ( tokenRequest.error.type == 'not-authorized') {
            return resetTokenInvalidView 
        } else if ( tokenRequest.error.type == 'no-token' ) {
            return resetTokenInvalidView 
        } else if ( tokenRequest.error.type == 'logged-in' ) {
            return  loggedInErrorView
        } else {
            return resetTokenInvalidView 
        }
    }

    // If something's wrong with the PATCH /user request, then we probably
    // don't want to render the form here either, with some exceptions.
    if ( request && request.state == 'failed' ) {
        if ( request.error == 'not-authorized') {
            return resetTokenInvalidView 
        } else if ( request.error == 'logged-in' ) {
            return loggedInErrorView 
        } else if ( request.error == 'not-found' ) {
            return resetTokenInvalidView 
        } else if ( request.error == 'invalid' ) {
            baseError += request.errorMessage
        } else if ( request.error == 'server-error' ) {
            return (
                <div className="reset-password-form">
                    <p>We hit an error on the server side that we couldn't recover from.  This is a bug!  Please report it.</p>
                    <p>Error message: { request.errorMessage }</p>
                </div>
            )
        }
    }

    let passwordErrors = passwordValidationError.join(' ') 
    let passwordConfirmationErrors = passwordConfirmationValidationError.join(' ') 

    const inProgress = request && request.state == 'pending'

    return (
        <div className="reset-password-form">
            <form onSubmit={onSubmit}>
                <div className="instructions">Please enter a new password for your Communities account.</div> 
                <Input
                    name="new-password"
                    label="New Password"
                    explanation="Enter a new password.  It must be at least 12 characters long."
                    type="password"
                    value={newPassword}
                    onBlur={ (event) => isValid('newPassword') }
                    onChange={(event) => setNewPassword(event.target.value)}
                    error={passwordErrors} />
                <Input
                    name="confirm-new-password"
                    label="Confirm New Password"
                    explanation="Please enter your new password again to confirm it."
                    type="password"
                    value={confirmNewPassword}
                    onBlur={ (event) => isValid('confirmNewPassword') }
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    error={passwordConfirmationErrors} />

                { baseError && <div className="error">{ baseError }</div> }
                { ! baseError && <div className="submit">
                    { inProgress && <Button type="primary" onClick={() => {}}><Spinner /></Button> }
                    { ! inProgress && <input type="submit" name="submit" value="Reset Password" />  }
                </div> }
            </form>
        </div>   
    )
}

export default ResetPasswordForm
