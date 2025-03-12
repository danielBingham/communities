import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { patchAuthentication } from '/state/authentication'
import { patchUser } from '/state/users'

import Input from '/components/generic/input/Input'
import Spinner from '/components/Spinner'

import './ChangeEmailForm.css'

const ChangeEmailForm = function(props) {

    // ======= Render State =========================================

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const [emailError, setEmailError] = useState(null)
    const [passwordError, setPasswordError] = useState(null)

    // ======= Request Tracking =====================================

    const [authRequest, makeAuthRequest] = useRequest()
    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================

    const currentUser = useSelector((state) => state.authentication.currentUser)

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

        if ( ! field || field == 'email' ) {
            if ( ! email || email.length == 0 ) {
                setEmailError('Email required.')
                error = true
            } else if ( email.length > 512 ) {
                setEmailError('Your email is too long.  Limit is 512 characters.')
                error = true
            } else if ( ! email.includes('@') ) {
                setEmailError('Please enter a valid email.')
                error = true
            } else if ( emailError ) {
                setEmailError(null)
            }
        }

        if ( ! field || field == 'password' ) {
            if ( email && email.length > 0 && (! password || password.length <= 0) ) {
                setPasswordError('Your password is required to change your email.')
            } else {
                setPasswordError(null)
            }
        }

        return ! error
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        // TODO TECHDEBT : We don't need to do this.  It's built into the patch
        // endpoint now.
        makeAuthRequest(patchAuthentication(currentUser.email, password))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( authRequest && authRequest.state == 'fulfilled') {
            if ( authRequest.response.status === 200 ) {
                const user = {
                    id: currentUser.id,
                    email: email,
                    oldPassword: password
                }
                makeRequest(patchUser(user))
            } 
        }
    }, [ authRequest ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            setEmail('')
            setPassword('')
        }
    }, [ request ])

    // ======= Render ===============================================

    let submit = null
    if ( ( request && request.state == 'pending') || (authRequest && authRequest.state == 'pending') ) {
        submit = ( <Spinner /> )
    } else {
        submit = ( <input type="submit" name="submit" value="Change Email" /> )
    }

    let errors = [] 
    if ( request && request.state == 'failed' ) {
        errors.push(
            <div key="request-failed" className="request-failed">
                { request.errorMessage && <span>{request.errorMessage}</span>}
                { ! request.errorMessage && <span>Something went wrong with the request: { request.error }.</span>}
            </div>
        )
    }
    if ( authRequest && authRequest.state == 'fulfilled' && authRequest.response.status !== 200 ) {
        errors.push(
            <div key="auth-failed" className="auth-failed">
                Authentication failed.  Please make sure you typed your password correctly.
            </div>
        )
    } else if (authRequest && authRequest.state == 'failed' ) {
        errors.push(
            <div key="auth-failed" className="auth-failed">
                Authentication failed.  Please make sure you typed your password correctly.
            </div>
        )
    }

    let result = null
    if ( request && request.state == 'fulfilled' ) {
        result = ( <div className="success">Email successfully updated!</div>)
    }

    return (
        <div className="change-email-form">
            <div className="change-email-form__instructions">To change your
            email, enter your new email and your current password. After you
                submit the form, we'll send a confirmation request to your
                new address. You'll need to click the link in the request to
                confirm your new email.  You will not be able to use the site
                until you successfully confirm it.</div>
            <form onSubmit={onSubmit}>
                <Input
                    name="email"
                    label="New Email"
                    explanation="What is your new email?"
                    value={email}
                    className="email"
                    onBlur={(event) => isValid('email')}
                    onChange={(event) => setEmail(event.target.value)}
                    error={emailError}
                />
                <Input
                    name="password"
                    type="password"
                    label="Password"
                    explanation="Please enter your current password to authenticate."
                    value={password}
                    className="password"
                    onBlur={(event) => isValid('password')}
                    onChange={(event) => setPassword(event.target.value)}
                    error={passwordError}
                />
                <div className="error"> { errors } </div>
                <div className="result"> { result } </div>
                <div className="submit"> { submit } </div>
            </form>
        </div>

    )

}

export default ChangeEmailForm
