import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { validateEmail, validatePassword } from '/lib/validation/user'

import { patchUser } from '/state/User'

import Input from '/components/ui/Input'
import Spinner from '/components/Spinner'

import './ChangeEmailForm.css'

const ChangeEmailForm = function(props) {

    // ======= Render State =========================================

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')

    const [emailError, setEmailError] = useState(null)
    const [passwordError, setPasswordError] = useState(null)

    // ======= Request Tracking =====================================

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
        const errors = []

        if ( ! field || field == 'email' ) {
            const emailValidationErrors = validateEmail(email, true)
            errors.push(...emailValidationErrors)
            if ( emailValidationErrors.length > 0) {
                setEmailError('Please enter a valid email.')
            } else {
                setEmailError(null)
            }
        }

        if ( ! field || field == 'password' ) {
            const passwordValidationErrors = validatePassword(password, true)
            errors.push(...passwordValidationErrors)
            if ( passwordValidationErrors.length > 0 ) {
                setPasswordError('Your password is required to change your email.')
            } else {
                setPasswordError(null)
            }
        }

        return errors.length === 0
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        const user = {
            id: currentUser.id,
            email: email,
            oldPassword: password
        }
        makeRequest(patchUser(user))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            setEmail('')
            setPassword('')
        }
    }, [ request ])

    // ======= Render ===============================================

    let submit = null
    if ( ( request && request.state == 'pending') ) {
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
