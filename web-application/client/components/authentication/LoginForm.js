import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

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
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    // ======= Request Tracking =====================================
  
    const [ request, makeRequest ] = useRequest()

    // ======= Redux State ==========================================
   
    const currentUser = useSelector((state) => state.authentication.currentUser)

    // ======= Actions and Event Handling ===========================

    /**
     * Handle the form's submission by attempting to authenticate the user.
     * Store the requestId so that we can track the request and respond to
     * errors.
     *
     * @param {Event} event Standard Javascript event.
     */
    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! email || email.length == 0 ) {
            setError('no-email')
            return
        }
        
        if ( ! password || password.length == 0 ) {
            setError('no-password')
            return
        } 

        makeRequest(postAuthentication(email, password))
    }

    // ======= Effect Handling ======================================

    // ====================== Render ==========================================
    
    if ( currentUser ) {
        logger.error(new Error(`Attempting to show LoginForm while someone's already logged in.`))
        return null
    }

    let errorMessage = ''
    if ( request && request.state == 'failed') {
        if ( request.response.status == 403 ) {
            errorMessage = "Login failed."
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
    } else if ( error == 'no-password' ) {
        errorMessage = " A password is required to login. "
    } else if ( error == 'no-email') {
        errorMessage = "An email is required to login."
    }

    const errorView = ( <div className="error">{ errorMessage }</div> )

    const isLoading = request && request.state == 'pending'
    return (
        <div className='login-form'>
            <h2>Login</h2>
            <form onSubmit={onSubmit}>
                <div className="error"> { errorView } </div>
                <Input
                    name="email"
                    label="Email"
                    /*explanation="Enter the email you used to register." */
                    value={email}
                    className="email"
                    onChange={ (event) => setEmail(event.target.value) } 
                />
                <Input
                    name="password"
                    type="password"
                    label="Password"
                    /*explanation="Enter your password."*/
                    value={password}
                    className="password"
                    onChange={ (event) => setPassword(event.target.value) } 
                />
                <div className="submit field-wrapper">
                    { isLoading && <Button type="primary" onClick={() => {}}><Spinner local={true} /></Button> }
                    { ! isLoading && <input type="submit" name="login" value="Login" /> }
                </div>
            </form>
            <div className="inner-wrapper">
                <div className="forgot-password">
                    <Link to="/reset-password-request">Forgot password?</Link>
                </div>
            </div>
        </div>
    )
}

export default LoginForm 
