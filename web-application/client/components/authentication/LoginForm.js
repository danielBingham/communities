import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'
import { validateEmail, validatePassword } from '/lib/validation/user'

import { postAuthentication } from '/state/authentication'

import Button from '/components/generic/button/Button'
import Input from '/components/generic/input/Input'
import Spinner from '/components/Spinner'

import './LoginForm.css'

/**
 * A login form allowing the user to postAuthentication using an email and a password.
 *
 * @param {object} props - An empty object, takes no props.
 */
const LoginForm = function(props) { 

    // ======= Render State =========================================
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState(null)
    const [password, setPassword] = useState('')
    const [passwordError, setPasswordError] = useState(null)


    // ======= Request Tracking =====================================
  
    const [ request, makeRequest ] = useRequest()

    // ======= Redux State ==========================================
   
    const currentUser = useSelector((state) => state.authentication.currentUser)

    // ======= Actions and Event Handling ===========================
    
    const isValid = function(field) {
        const errors = []

        if ( ! field || field === 'email' ) {
            const emailValidationErrors = validateEmail(email)
            if ( emailValidationErrors.length > 0 ) {
                setEmailError('Please enter a valid email.')
            } else {
                setEmailError(null)
            }
            errors.push(...emailValidationErrors)
        }

        if ( ! field || field === 'password' ) {
            const passwordValidationErrors = validatePassword(password)
            if ( passwordValidationErrors.length > 0 ) {
                setPasswordError('Please enter a valid password.')
            } else {
                setPasswordError(null)
            }
            errors.push(...passwordValidationErrors)
        }

        return errors.length === 0
    }

    /**
     * Handle the form's submission by attempting to authenticate the user.
     * Store the requestId so that we can track the request and respond to
     * errors.
     *
     * @param {Event} event Standard Javascript event.
     */
    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        makeRequest(postAuthentication(email, password))
    }

    // ======= Effect Handling ======================================

    // ====================== Render ==========================================
    
    if ( currentUser ) {
        logger.warn(new Error(`Attempting to show LoginForm while someone's already logged in.`))
        return (<div className="login-form"><Spinner /></div> ) 
    }

    let errorMessage = ''
    if ( request && request.state == 'failed') {
        if ( request.response.status == 403 ) {
            errorMessage = "Login failed."
        } else if ( request.response.status === 429 ) {
            errorMessage = "Too many failed attempts.  Please wait 15 minutes and try again."
        } else if ( request.response.status == 400) {
            if ( request.error.type == 'no-password' ) {
                errorMessage = "Your account appears to have been created using OAuth.  Please login with the authentication method you used to create it."
            } else if (request.error.type == 'password-required' ) {
                errorMessage = "You must enter a password to login."
            } else {
                errorMessage = "Login failed."
            }
        } else {
            errorMessage = "Something went wrong on the backend. Since this is an authentication error, we can't share any details (security). Please report a bug and we'll try to figure out it out from server logs."
        }
    } 

    const errorView = ( <div className="error">{ errorMessage }</div> )

    const isLoading = request && request.state == 'pending'
    if ( isLoading ) {
        return (
            <div className="login-form">
                <h2>Login</h2>
                <Spinner />
            </div>
        )
    }

    return (
        <div className='login-form'>
            <h2>Log In</h2>
            <form onSubmit={onSubmit}>
                <div className="error"> { errorView } </div>
                <Input
                    name="email"
                    label="Email"
                    /*explanation="Enter the email you used to register." */
                    value={email}
                    className="email"
                    error={emailError}
                    onBlur={(e) => isValid('email')}
                    onChange={ (event) => setEmail(event.target.value) } 
                />
                <Input
                    name="password"
                    type="password"
                    label="Password"
                    /*explanation="Enter your password."*/
                    value={password}
                    className="password"
                    error={passwordError}
                    onBlur={(e) => isValid('password')}
                    onChange={ (event) => setPassword(event.target.value) } 
                />
                <div className="submit field-wrapper">
                    <input type="submit" name="login" value="Log In" />
                </div>
            </form>
            <div className="inner-wrapper">
                <div className="forgot-password">
                    <Link to="/reset-password-request">Forgot password?</Link>
                </div>
                <div className="register">
                    New to Communities? <Link to="/register">Sign Up</Link>
                </div>
            </div>
        </div>
    )
}

export default LoginForm 
