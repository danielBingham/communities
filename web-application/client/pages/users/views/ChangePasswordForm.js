import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { validatePassword } from '/lib/validation/user'

import { patchAuthentication } from '/state/authentication'
import { patchUser } from '/state/User'

import Input from '/components/generic/input/Input'
import Spinner from '/components/Spinner'

import './ChangePasswordForm.css'

const ChangePasswordForm = function(props) {

    // ======= Render State =========================================

    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [oldPassword, setOldPassword] = useState('')

    const [newPasswordError, setNewPasswordError] = useState(null)
    const [newPasswordConfirmationError, setNewPasswordConfirmationError] = useState(null)

    // ======= Request Tracking =====================================

    const [request, makeRequest] = useRequest()
    const [authRequest, makeAuthRequest] = useRequest()

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
        let haveError = false 

        if ( ! field || field == 'newPassword' ) {
            const newPasswordValidationErrors = validatePassword(newPassword)
            if ( newPasswordValidationErrors.length > 0) {
                setNewPasswordError(newPasswordValidationErrors.join(' '))
                haveError = true
            } else {
                setNewPasswordError(null)
            }
        }

        if ( ! field || field =='confirmNewPassword' ) {
            if (newPassword != confirmNewPassword) {
                setNewPasswordConfirmationError('Your passwords must match.')
                haveError = true 
            } else {
                setNewPasswordConfirmationError(null)
            }
        }

        return ! haveError 
    }

    const onSubmit = function(event) {
        event.preventDefault()

        if ( ! isValid() ) {
            return
        }

        makeAuthRequest(patchAuthentication(currentUser.email, oldPassword))
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        if ( authRequest && authRequest.state == 'fulfilled') {
            if ( authRequest.response.status == 200 ) {
                const user = {
                    id: currentUser.id,
                    password: newPassword,
                    oldPassword: oldPassword
                }

                makeRequest(patchUser(user))
            }
        }
    }, [ authRequest ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled' ) {
            setNewPassword('')
            setConfirmNewPassword('')
            setOldPassword('')
        }
    }, [ request ])

    // ======= Render ===============================================

    let submit = null
    if ( ( request && request.state == 'pending') || (authRequest && authRequest.state == 'pending') ) {
        submit = ( <Spinner /> )
    } else {
        submit = ( <input type="submit" name="submit" value="Change Password" /> )
    }

    let oldPasswordError = null
    if ( authRequest && authRequest.state == 'fulfilled' && authRequest.response.status != 200) {
        oldPasswordError = ( 
            <div className="authentication-failure">
                Authentication failed.  Make sure you typed your old password correctly.
            </div>
        )
    } else if ( authRequest && authRequest.state == 'failed' ) {
        oldPasswordError = ( 
            <div className="authentication-failure">
                Authentication failed.  Make sure you typed your old password correctly.
            </div>
        )
    }

    let result = null
    if ( authRequest && authRequest.state == 'fulfilled' && request && request.state == 'fulfilled' ) {
        result = (
            <div className="success">
                Password successfully updated!
            </div>
        )
    } else if ( authRequest && authRequest.state == 'fulfilled' && request && request.state == 'failed' ) {
        result = (
            <div className="request-failure">
                Something went wrong with the attempt to update your password.  Please try again.<br />
                If the error persists, please report a bug.
            </div>
        )
    }

    return (
        <div className="change-password-form">
            <form onSubmit={onSubmit}>
                <Input 
                    name="new-password"
                    type="password"
                    label="New Password"
                    explanation="Enter the new password you want to use."
                    value={newPassword}
                    className="new-password"
                    onBlur={(event) => isValid('newPassword') }
                    onChange={(event) => setNewPassword(event.target.value)}
                    error={newPasswordError}
                />
                <Input 
                    name="confirm-new-password"
                    type="password"
                    label="Confirm New Password"
                    explanation="Please enter your new password again to confirm it."
                    value={confirmNewPassword}
                    className="confirm-new-password"
                    onBlur={(event) => isValid('confirmNewPassword')}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    error={newPasswordConfirmationError}
                />
                <Input 
                    name="old-password"
                    type="password"
                    label="Old Password"
                    explanation="Please enter your old password to authenticate."
                    value={oldPassword}
                    className="old-password"
                    onChange={(event) => setOldPassword(event.target.value)}
                    error={oldPasswordError}
                />
                <div className="result">
                    { result }
                </div>
                <div className="submit">
                    { submit }                    
                </div>
            </form>
        </div>   
    )
}

export default ChangePasswordForm
