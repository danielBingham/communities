import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import * as shared from '@communities/shared'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'
import { validateEmail, validateName, validateUsername, validatePassword } from '/lib/validation/user'

import { validateToken } from '/state/tokens'
import { patchUser, getUsers } from '/state/User'

import Input from '/components/ui/Input'
import { Checkbox } from '/components/ui/Checkbox'

import './AcceptInvitationForm.css'

const AcceptInvitationForm = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [ token, setToken ] = useState('')
    const [ name, setName ] = useState('')
    const [ username, setUsername ] = useState('')
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ confirmPassword, setConfirmPassword ] = useState('')
    const [ birthdate, setBirthdate ] = useState('')

    const [tokenValidationError, setTokenValidationError] = useState([])
    const [nameValidationError, setNameValidationError] = useState([])
    const [usernameValidationError, setUsernameValidationError] = useState([])
    const [emailValidationError, setEmailValidationError] = useState([])
    const [passwordValidationError, setPasswordValidationError] = useState([])
    const [confirmPasswordValidationError, setConfirmPasswordValidationError] = useState([])
    const [birthdateValidationError, setBirthdateValidationError] = useState([])

    const tokenRequestRef = useRef(null)

    const [tokenRequest, makeTokenRequest] = useRequest()
    const [request, makeRequest] = useRequest()
    const [usernameRequest, makeUsernameRequest] = useRequest()

    const existing = useSelector((state) => username in state.User.byUsername ? state.User.byUsername[username] : undefined)
    const user = useSelector((state) => token in state.tokens.usersByToken ? state.tokens.usersByToken[token] : null) 

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
                makeTokenRequest(validateToken(token, 'invitation'))
            }, 500)
        }

        if ( ! field || field == 'name' ) {
            const nameErrors = validateName(name, true) 
            error = error || nameErrors.length > 0
            setNameValidationError(nameErrors)
        }

        if ( ! field || field == 'username' ) {
            const usernameErrors = validateUsername(username, true) 

            if ( existing && existing.username === username ) {
                usernameErrors.push('That username is already in use.  Please choose a different one.')
            }

            error = error || usernameErrors.length > 0
            setUsernameValidationError(usernameErrors)
        }

        if ( ! field || field == 'email' ) {
            const emailErrors = validateEmail(email, true) 
            error = error || emailErrors.length > 0
            setEmailValidationError(emailErrors)
        }

        if ( ! field || field == 'password' ) {
            const passwordErrors = validatePassword(password, true) 
            error = error || passwordErrors.length > 0
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

        if ( ! field || field === 'birthdate' ) {
            const birthdateErrors = shared.validation.User.validateBirthdate(birthdate) 
            if ( birthdateErrors.length > 0 ) {
                setBirthdateValidationError(birthdateErrors.map((error) => error.message))
            } else {
                setBirthdateValidationError([])
            }
            error = error || birthdateErrors.length > 0
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

        const userPatch = {
            id: user.id,
            name: name,
            username: username,
            email: email,
            password: password,
            birthdate: birthdate,
            token: token
        }

        makeRequest(patchUser(userPatch))
    }

    const onNameChange = function(event) {
        let currentUsername = name.toLowerCase().replaceAll(/\s/g, '-')
        currentUsername = currentUsername.replaceAll(/[^a-zA-Z0-9\-_]/g, '')

        // When this is called, `event.target.value` will be the next value of
        // `title` and `title` will be the current value for it.  We only want
        // to update the `slug` if the user kept the `slug` as the
        // autogenerated one.  In other words, if we generate a slug from
        // `title` and it matches our current slug then we want to update our
        // current slug for the new value of title.  Otherwise, we don't want
        // to change it, because the user already customized it.
        if ( username == currentUsername) {
            let newUsername = event.target.value.toLowerCase().replaceAll(/\s/g, '-')
            newUsername = newUsername.replaceAll(/[^a-zA-Z0-9\-_]/g, '')
            setUsername(newUsername)
        }

        setName(event.target.value)
    }

    const onUsernameBlur = function(event) {
        let lowerUsername = username.toLowerCase()
        setUsername(lowerUsername)

        makeUsernameRequest(getUsers(username, { username: lowerUsername }))
        isValid('username')
    }

    useEffect(function() {
        if ( nameValidationError.length > 0 ) {
            isValid('name')
        }

    }, [ name, nameValidationError ])

    useEffect(function() {
        if ( usernameValidationError.length > 0 ) {
            isValid('username')
        }
    }, [ username, usernameValidationError ])

    useEffect(function() {
        if ( emailValidationError.length > 0 ) {
            isValid('email')
        }
    }, [ email, emailValidationError ])

    useEffect(function() {
        if ( passwordValidationError.length > 0 ) {
            isValid('password')
        }
    }, [ password, passwordValidationError ])

    useEffect(function() {
        if ( confirmPasswordValidationError.length > 0 ) {
            isValid('confirmPassword')
        }
    }, [ confirmPassword, confirmPasswordValidationError ])

    useEffect(function() {
        if ( birthdateValidationError.length > 0 ) {
            isValid('birthdate')
        }
    }, [ birthdate, birthdateValidationError ])

    useEffect(function() {
        if ( user ) {
            setEmail(user.email)
        }
    }, [ user ])

    useEffect(function() {
        const initialToken = searchParams.get('token')
        if ( initialToken ) {
            setToken(initialToken)
            makeTokenRequest(validateToken(initialToken, 'invitation'))
        }
    }, [ searchParams ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            window.location.href = "/"
        } 
    }, [ request ])

    useEffect(function() {
        if ( usernameRequest && usernameRequest.state === 'fulfilled' ) {
            isValid('username')
        }
    }, [ usernameRequest])

    useEffect(function() {
        return function cleanup() {
            if ( tokenRequestRef.current ) {
                clearTimeout(tokenRequestRef.current)
            }
        }
    }, [])

    /**************************************************************************
     * Render
     * ************************************************************************/

    let baseError = null
    let tokenError = tokenValidationError.join(' ')
    let nameError = nameValidationError.join(' ')
    let usernameError = usernameValidationError.join(' ')
    let emailError = emailValidationError.join(' ')
    let passwordError = passwordValidationError.join(' ')
    let confirmPasswordError = confirmPasswordValidationError.join(' ')
    let birthdateError = birthdateValidationError.join(' ')

    if ( tokenRequest && tokenRequest.state == 'failed' ) {
        if ( tokenRequest.error.type == 'not-authorized' ) {
            tokenError = (<div>
                <p>Invalid token. {tokenError}</p>
                <p>If you did get here following a valid invitation, please
                        reach out to us at <a
                            href="mailto:contact@communities.social">contact@communties.social</a>,
                        so we can figure out what went wrong and get you a new
                    invitation.</p>
                </div>)
        }  else if ( tokenRequest.error.type == 'logged-in') {
            return (
                <div className="error">
                    <p>You appear to already be logged in to a different user.</p>
                    <p>Please return to the <a href="/">home page</a> and logout before attempting to accept this invitation.</p>
                </div>
            )
        }
    } 

    if ( request && request.state == 'failed' ) {
        baseError = (<div className="error">{ request.error.message }</div>)
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
                    onChange={ (event) => setToken(event.target.value) } 
                    error={tokenError}
                /> }
                <Input
                    name="name"
                    label="Full Name"
                    explanation="The name people will see on your profile.  We encourage you to use your real, full name so that people can find you, but we don't enforce that."
                    value={name}
                    className="name"
                    onBlur={ (event) => isValid('name') }
                    onChange={onNameChange} 
                    error={nameError}
                />
                <Input
                    name="username"
                    label="Username"
                    explanation="The unique username that will be used to link to your profile.  Must start with a letter and can only contain letters, numbers, dash ( - ), or undercore ( _ )"
                    value={username}
                    className="username"
                    onBlur={ onUsernameBlur }
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
                <Input
                    name="birthdate"
                    type="date"
                    label="Date of Birth"
                    explanation="Please enter your date of birth.  This is required by state laws that mandate social media platforms enforce age limits on their users."
                    value={birthdate}
                    className="date-of-birth"
                    onBlur={ (event) => isValid('birthdate') }
                    onChange={ (event) => setBirthdate(event.target.value) }
                    error={birthdateError}
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
