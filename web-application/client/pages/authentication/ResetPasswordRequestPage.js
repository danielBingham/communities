import React, { useState } from 'react'

import { useRequest } from '/lib/hooks/useRequest'
import { validateEmail } from '/lib/validation/user'

import { createToken } from '/state/tokens'

import CommunitiesLogo from '/components/header/CommunitiesLogo'
import Input from '/components/generic/input/Input'
import Spinner from '/components/Spinner'
import Button from '/components/generic/button/Button'

import './ResetPasswordRequestPage.css'

const ResetPasswordRequestPage = function(props) {
    const [ email, setEmail ] = useState('')
    const [ emailErrors, setEmailErrors ] = useState([])

    const [ request, makeRequest ] = useRequest()

    const isValid = function(field) {

        const errors = []

        if ( ! field || field === 'email' ) {
            const emailValidationErrors = validateEmail(email)
            errors.push(...emailValidationErrors)
            setEmailErrors(emailValidationErrors)
        } else {
            setEmailErrors([])
        }

        return errors.length === 0
    }

    function onSubmit(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        makeRequest(createToken({ type: 'reset-password', email: email }))
    }

    let content = ( <div className="error">If you see this, it's a bug.  Please report it!</div> )
    let inProgress = request && request.state == 'pending'

    // If they've submitted the request.
    if ( request && request.state == 'fulfilled' ) {
        content = (
            <div className="success">
                <p>Link sent.  Check your email.</p>
                <p>If the email does not arrive shortly, you can refresh this
                    page to request another one.</p> 
                <p>Make sure to type your email correctly, as we can't tell you
                    if you've entered an incorrect email.</p> 
            </div>
        )
    } else if ( request && request.state == 'failed' ) {
        content = (
            <div className="error">
                <p>Something went wrong in a way we couldn't handle.  This is a bug, please report it!</p>
                <p>Error Type: { request.error.type }</p>
                <p>Error Message: { request.error.message }</p>
            </div>
        )
    }

    // Otherwise, render the form.
    else {
        content = (
            <form onSubmit={onSubmit}>
                <Input
                    name="email"
                    label="Account Email"
                    explanation={`Please enter your email address to request a password reset
                        link.  A link will be sent to the address you provide. To reset
                        your password, click the link in the email.  You will be taken
                        back here and able to enter a new password.`}
                    value={email}
                    className="email"
                    error={emailErrors.join(' ')}
                    onChange={(e) => setEmail(e.target.value) }
                    onBlur={(e) => isValid('email') }
                />
                <div className="submit">
                    { inProgress && <Button type="primary" onClick={() => {}}><Spinner /></Button> }
                    { ! inProgress && <input type="submit" name="submit" value="Request Password Reset Link" /> }
                </div>
            </form>
        )

    }

    return (
        <div id="reset-password-request">
            <div className="logo"><CommunitiesLogo /></div>
            { content }
        </div>
    )

}

export default ResetPasswordRequestPage
