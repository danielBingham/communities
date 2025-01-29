import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {  useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { validateToken } from '/state/tokens'
import { patchUser, cleanupRequest } from '/state/users'

import Input from '/components/generic/input/Input'

import './AcceptInvitationForm.css'

const AcceptInvitationForm = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================

    const [ token, setToken ] = useState('')
    const [ name, setName ] = useState('')
    const [ username, setUsername ] = useState('')
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ confirmPassword, setConfirmPassword ] = useState('')

    const [tokenValidationError, setTokenValidationError] = useState([])
    const [nameValidationError, setNameValidationError] = useState([])
    const [usernameValidationError, setUsernameValidationError] = useState([])
    const [emailValidationError, setEmailValidationError] = useState([])
    const [passwordValidationError, setPasswordValidationError] = useState([])
    const [confirmPasswordValidationError, setConfirmPasswordValidationError] = useState([])

    const tokenRequestRef = useRef(null)

    // ======= Request Tracking =====================================

    const [ tokenRequest, setTokenRequestId ] = useRequest()

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if (requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    // ======= Redux State ==========================================

    const user = useSelector(function(state) {
        if ( token in state.tokens.usersByToken ) {
            return state.tokens.usersByToken[token]
        } else {
            return null
        }
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

        if ( field == 'token') {
            if ( tokenRequestRef.current ) {
                clearTimeout(tokenRequestRef.current)
            }
            tokenRequestRef.current = setTimeout(function() {
                setTokenRequestId(dispatch(validateToken(token, 'invitation')))
            }, 500)
        }

        if ( ! field || field == 'name' ) {
            const nameErrors = []

            if ( ! name || name.length == 0 ) {
                nameErrors.push('Name is required!')
                error = true
            } 

            if ( name.length > 512 ) {
                nameErrors.push('Name is too long. Limit is 512 characters.')
                error = true
            } 

            setNameValidationError(nameErrors)
        }

        if ( ! field || field == 'username' ) {
            const usernameErrors = []

            if ( ! username || username.length == 0 ) {
                usernameErrors.push('Username is required!')
                error = true
            } 

            if ( username.length > 512 ) {
                usernameErrors.push('Username is too long. Limit is 512 characters.')
                error = true
            }         

            setUsernameValidationError(usernameErrors)
        }

        if ( ! field || field == 'email' ) {
            const emailErrors = []

            if ( ! email || email.length == 0 ) {
                emailErrors.push('Email is required!')
                error = true
            } 

            if ( email.length > 512 ) {
                emailErrors.push('Email is too long.  Limit is 512 characters.')
                error = true
            } 

            if ( ! email.includes('@') ) {
                emailErrors.push('Please enter a valid email.')
                error = true
            } 

            setEmailValidationError(emailErrors)
        }

        if ( ! field || field == 'password' ) {
            const passwordErrors = []

            if ( ! password || password.length == 0 ) {
                passwordErrors.push('Password is required!')
                error = true
            } 

            if ( password.length < 16 ) {
                passwordErrors.push('Your password is too short.  Please choose a password at least 16 characters in length.')
                error = true
            } 

            if ( password.length > 256 ) {
                passwordErrors.push('Your password is too long. Limit is 256 characters.')
                error = true
            } 

            setPasswordValidationError(passwordErrors)

        }

        if ( ! field || field =='confirmPassword' ) {
            const passwordConfirmationErrors = []

            if (password != confirmPassword) {
                passwordConfirmationErrors.push('Your passwords don\'t match!')
                error = true 
            } 

            setConfirmPasswordValidationError(passwordConfirmationErrors)
        }

        return ! error
    }

    const acceptInvitation = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return 
        }

        if ( ! user ) {
            setTokenValidationError(['You must have a valid token to register.'])
        }

        console.log(user)
        console.log(token)

        const userPatch = {
            id: user.id,
            name: name,
            username: username,
            email: email,
            password: password,
            token: token
        }

        setRequestId(dispatch(patchUser(userPatch)))
    }

    // ======= Effect Handling ======================================
    
    useEffect(function() {
        if ( user ) {
            setEmail(user.email)
        }
    }, [ user ])

    useEffect(function() {
        const initialToken = searchParams.get('token')
        if ( initialToken ) {
            setToken(initialToken)
            setTokenRequestId(dispatch(validateToken(initialToken, 'invitation')))
        }
    }, [ searchParams ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            window.location.href = "/"
        } 
    }, [ request ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    useEffect(function() {
        return function cleanup() {
            if ( tokenRequestRef.current ) {
                clearTimeout(tokenRequestRef.current)
            }
        }
    }, [])


    let baseError = null
    let tokenError = tokenValidationError.join(' ')
    let nameError = nameValidationError.join(' ')
    let usernameError = usernameValidationError.join(' ')
    let emailError = emailValidationError.join(' ')
    let passwordError = passwordValidationError.join(' ')
    let confirmPasswordError = confirmPasswordValidationError.join(' ')

    if ( request && request.state == 'failed' ) {
        if ( request.error == 'not-authorized' ) {
            baseError = (
                <div className="error">
                    <p>Invalid token. Something may have gone wrong on our end.</p>
                    <p>
                        If you did get here following a valid invitation, please
                        reach out to us at <a
                            href="mailto:contact@communities.social">contact@communties.social</a>,
                        so we can figure out what went wrong and get you a new
                        invitation.
                    </p>
                </div>
            )
        }  else if ( request.status == 409 ) {
            emailError += ' A user with that email already exists.  Please login instead.'
        }
    }

    return (
        <div className="accept-invitation-form">
            <div className="instructions">Welcome to Communities, please complete your registration!</div>
            <form onSubmit={acceptInvitation}>
                { ! user && <Input
                    name="token"
                    label="Token"
                    explanation="This is the token from your invitation email.  If you followed the link in the email it will be auto-populated.  Otherwise, you'll need to copy and paste it from your invitation email."
                    value={token}
                    className="token"
                    onBlur={ (event) => isValid('token') }
                    onChange={ (event) => setName(event.target.value) } 
                    error={tokenError}
                /> }
                <Input
                    name="name"
                    label="Name"
                    explanation="The name people will see on your profile.  We strongly encourage you to use your real name, but we don't enforce that."
                    value={name}
                    className="name"
                    onBlur={ (event) => isValid('name') }
                    onChange={ (event) => setName(event.target.value) } 
                    error={nameError}
                />
                <Input
                    name="username"
                    label="Username"
                    explanation="The unique username that will be used to link to your profile.  Can only contain letters, numbers, period ( . ), dash ( - ), or undercore ( _ )"
                    value={username}
                    className="username"
                    onBlur={ (event) => isValid('username') }
                    onChange={ (event) => setUsername(event.target.value) } 
                    error={usernameError}
                />
                <Input
                    name="email"
                    label="Email"
                    explanation="The email you will use to log in.  Will also receive notifications and will be used to reset your password if you forget it."
                    value={email}
                    className="email"
                    onBlur={ (event) => isValid('email') }
                    onChange={ (event) => setEmail(event.target.value) } 
                    error={emailError}
                />

                <Input
                    name="password"
                    type="password"
                    label="Password"
                    explanation="The password you will use to log in. Must be at least 16 characters long.  We recommend using the passphrase approach and/or using a password manager."
                    value={password}
                    className="password"
                    onBlur={ (event) => isValid('password') }
                    onChange={ (event) => setPassword(event.target.value) } 
                    error={passwordError}
                />
                <Input
                    name="confirmPassword"
                    type="password"
                    label="Confirm Password"
                    explanation="Please enter your password again to confirm it."
                    value={confirmPassword}
                    className="confirm-password"
                    onBlur={ (event) => isValid('confirmPassword') }
                    onChange={ (event) => setConfirmPassword(event.target.value) }
                    error={confirmPasswordError}
                />
                <div className="base-error">
                    { baseError }
                </div>
                <div className="submit field-wrapper">
                    <input type="submit" name="register" value="Accept Invitation" />
                </div>

            </form>
        </div>
    )
}

export default AcceptInvitationForm
