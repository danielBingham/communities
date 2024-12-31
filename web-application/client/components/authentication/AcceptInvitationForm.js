import React, { useState, useLayoutEffect, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { patchUser, cleanupRequest } from '/state/users'

import Input from '/components/generic/input/Input'

import './AcceptInvitationForm.css'

const AcceptInvitationForm = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    // ======= Render State =========================================
    
    const [ name, setName ] = useState('')
    const [ username, setUsername ] = useState('')
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ confirmPassword, setConfirmPassword ] = useState('')

    const [nameError, setNameError] = useState(null)
    const [usernameError, setUsernameError] = useState(null)
    const [emailError, setEmailError] = useState(null)
    const [passwordError, setPasswordError] = useState(null)
    const [confirmPasswordError, setConfirmPasswordError] = useState(null)
    const [baseError, setBaseError] = useState(null)

    // ======= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if (requestId ) {
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
    const navigate = useNavigate()

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

        if ( ! field || field == 'name' ) {
            if ( ! name || name.length == 0 ) {
                setNameError('Name is required!')
                error = true
            } else if ( name.length > 512 ) {
                setNameError('Name is too long. Limit is 512 characters.')
                error = true
            } else if ( nameError ) {
                setNameError(null)
            }
        }

        if ( ! field || field == 'username' ) {
            if ( ! username || username.length == 0 ) {
                setNameError('Username is required!')
                error = true
            } else if ( username.length > 512 ) {
                setNameError('Username is too long. Limit is 512 characters.')
                error = true
            } else if ( usernameError ) {
                setNameError(null)
            }
        }

        if ( ! field || field == 'email' ) {
            if ( ! email || email.length == 0 ) {
                setEmailError('Email is required!')
                error = true
            } else if ( email.length > 512 ) {
                setEmailError('Email is too long.  Limit is 512 characters.')
                error = true
            } else if ( ! email.includes('@') ) {
                setEmailError('Please enter a valid email.')
                error = true
            } else if ( emailError ) {
                setEmailError(null)
            }
        }

        if ( ! field || field == 'password' ) {
            if ( ! password || password.length == 0 ) {
                setPasswordError('Password is required!')
                error = true
            } else if ( password.length < 16 ) {
                setPasswordError('Your password is too short.  Please choose a password at least 16 characters in length.')
                error = true
            } else if ( password.length > 256 ) {
                setPasswordError('Your password is too long. Limit is 256 characters.')
                error = true
            } else if ( passwordError ) {
                setPasswordError(null)
            }
        }

        if ( ! field || field =='confirmPassword' ) {
            if (password != confirmPassword) {
                setConfirmPasswordError('Your passwords don\'t match!')
                error = true 
            } else if ( confirmPasswordError ) {
                setConfirmPasswordError(null)
            }
        }

        return ! error
    }

    const acceptInvitation = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return 
        }

        // We're assuming this exists, AcceptInvitationPage should have checked
        // for us.
        const token = searchParams.get('token')
        const user = {
            id: currentUser.id,
            name: name,
            username: username,
            email: email,
            password: password,
            token: token
        }

        setRequestId(dispatch(patchUser(user)))
    }

    // ======= Effect Handling ======================================
    
    useEffect(function() {
        setEmail(currentUser.email)
    }, [ currentUser ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            navigate("/")
        } else if ( request && request.state == 'failed') {
            if ( request.status == 409 ) {
                setEmailError('A user with that email already exists.  Please login instead.')
            } else {
                setBaseError(request.error)
            }
        }
    }, [ request ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    return (
        <div className="accept-invitation-form">
            <div className="instructions">Welcome to Communities, please complete your registration!</div>
            <form onSubmit={acceptInvitation}>
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
