/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import * as shared from '@communities/shared'

import { useRequest } from '/lib/hooks/useRequest'
import { validateEmail, validateName, validateUsername, validatePassword } from '/lib/validation/user'

import { postUsers, getUsers } from '/state/User'

import Input from '/components/ui/Input'
import { Checkbox } from '/components/ui/Checkbox'

import './RegistrationForm.css'

const RegistrationForm = function(props) {

    const [ name, setName ] = useState('')
    const [ username, setUsername ] = useState('')
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ confirmPassword, setConfirmPassword ] = useState('')
    const [ birthdate, setBirthdate ] = useState('')

    const [nameValidationError, setNameValidationError] = useState([])
    const [usernameValidationError, setUsernameValidationError] = useState([])
    const [emailValidationError, setEmailValidationError] = useState([])
    const [passwordValidationError, setPasswordValidationError] = useState([])
    const [confirmPasswordValidationError, setConfirmPasswordValidationError] = useState([])
    const [birthdateValidationError, setBirthdateValidationError] = useState([])

    const [request, makeRequest] = useRequest()
    const [usernameRequest, makeUsernameRequest] = useRequest()

    const existing = useSelector((state) => username in state.User.byUsername ? state.User.byUsername[username] : undefined)

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

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return 
        }

        const user = {
            name: name,
            username: username,
            email: email,
            password: password,
            birthdate: birthdate
        }

        makeRequest(postUsers(user))
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

    const onBirthdateChange = function(event) {
        let value = event.target.value
        value = shared.lib.date.coerceDateFormat(value, birthdate)
        setBirthdate(value)
    }

    useEffect(function() {
        if ( nameValidationError.length > 0 ) {
            isValid('name')
        }

    }, [ name ])

    useEffect(function() {
        if ( usernameValidationError.length > 0 ) {
            isValid('username')
        }
    }, [ username ])

    useEffect(function() {
        if ( emailValidationError.length > 0 ) {
            isValid('email')
        }
    }, [ email ])

    useEffect(function() {
        if ( passwordValidationError.length > 0 ) {
            isValid('password')
        }
    }, [ password ])

    useEffect(function() {
        if ( confirmPasswordValidationError.length > 0 ) {
            isValid('confirmPassword')
        }
    }, [ confirmPassword ])

    useEffect(function() {
        if ( birthdateValidationError.length > 0 ) {
            isValid('birthdate')
        }
    }, [ birthdate ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            window.location.href = "/email-confirmation"
        }
    }, [ request ])

    useEffect(function() {
        if ( usernameRequest && usernameRequest.state === 'fulfilled' ) {
            isValid('username')
        }
    }, [ usernameRequest])

    /**************************************************************************
     * Render
     * ************************************************************************/

    let baseError = null
    let nameError = nameValidationError.join(' ')
    let usernameError = usernameValidationError.join(' ')
    let emailError = emailValidationError.join(' ')
    let passwordError = passwordValidationError.join(' ')
    let confirmPasswordError = confirmPasswordValidationError.join(' ')
    let birthdateError = birthdateValidationError.join(' ')

    if ( request && request.state == 'failed' ) {
        if ( 'message' in request.error ) {
            baseError = (<div className="error">{ request.error.message }</div>)
        } else if ( 'all' in request.error ) {
            let message = ''
            for(const error of request.error.all) {
                message = message + error.message
            }
            baseError = (<div className="error">{ message }</div>)
        }
    }

    return (
        <div className="registration-form">
            <div className="instructions">Welcome to Communities, please complete your registration!</div>
            <form onSubmit={onSubmit}>
                <Input
                    name="name"
                    label="Full Name"
                    explanation="The name people will see on your profile.  We encourage you to use your real, full name so that people can find you, but we don't enforce that."
                    value={name}
                    placeholder="John Doe"
                    className="name"
                    onBlur={ (event) => isValid('name') }
                    onChange={onNameChange} 
                    error={nameError}
                />
                <Input
                    name="username"
                    label="Username"
                    explanation="The unique username that will be used to link to your profile.  Must start with a letter, be at least two characters long, and can only contain letters, numbers, dash ( - ), or undercore ( _ )"
                    value={username}
                    placeholder="john-doe"
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
                    placeholder="john-doe@example.com"
                    className="email"
                    onBlur={ (event) => isValid('email') }
                    onChange={ (event) => setEmail(event.target.value) } 
                    error={emailError}
                />

                <Input
                    name="password"
                    type="password"
                    label="Password"
                    explanation="The password you will use to log in. Must be at least 12 characters long.  We recommend using the passphrase approach and/or using a password manager."
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
                    type="text"
                    label="Date of Birth"
                    explanation="Please enter your date of birth using the format 'YYYY-MM-DD', eg. '1933-08-07'.  This is required by state laws that mandate social media platforms enforce age limits on their users. We will delete your birthdate once we have verified your age."
                    value={birthdate}
                    className="date-of-birth"
                    placeholder="YYYY-MM-DD"
                    onBlur={ (event) => isValid('birthdate') }
                    onChange={onBirthdateChange}
                    error={birthdateError}
                />

                <div className="base-error">
                    { baseError }
                </div>
                <div className="submit field-wrapper">
                    <input type="submit" name="register" value="Sign Up" />
                </div>

            </form>
        </div>
    )
}

export default RegistrationForm
