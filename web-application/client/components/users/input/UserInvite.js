import React, { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { postUsers, cleanupRequest } from '/state/users'

import UserTag from '/components/users/UserTag'
import Spinner from '/components/Spinner'
import Button from '/components/generic/button/Button'

import './UserInvite.css'

const UserInvite = function() {
    const [ email, setEmail ] = useState('')

    const [ submissionError, setSubmissionError ] = useState(false)

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.users.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dispatch = useDispatch()

    const invite = function(event) {
        event.preventDefault()
        event.stopPropagation()

        if ( ! email ) {
            setSubmissionError(true)
            return
        }

        setRequestId(dispatch(postUsers({
            email: email
        })))

        setEmail('')
    }

    const onKeyDown = function(event) {
        if ( event.key == 'Enter' ) {
            invite(event)
        } 
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    let requestError = null
    let successMessage = null

    if ( ! request || request.state != 'pending' ) {
        if ( request && request.state == 'failed' ) {
            if ( request.errorMessage ) {
                requestError = (
                    <div className="error">
                        { request.errorMessage }
                    </div>
                )
            } else {
                requestError = (
                    <div className="error">
                        Something went wrong: { request.error }
                    </div>
                )
            }
        }
        if ( request && request.state == 'fulfilled' ) {
            successMessage = (
                <div className="success">
                    Invite sent! 
                </div>
            )
        }
    }


    return (
        <div className="user-invite">
            <div className="user-invite__invitations-available">You have { currentUser.invitations } invitations available.</div>
            <div className="user-invite__input-wrapper">
                <input 
                    type="text" 
                    onChange={(e) => setEmail(e.target.value)} 
                    onKeyDown={onKeyDown}
                    value={email}  
                    name="email" 
                    placeholder="Enter email..." 
                />
                { request && request.state == 'pending' ? <Spinner local={true} /> : <Button type="primary" onClick={invite}>Send Invite</Button> }
            </div>
            <div className="user-invite__errors">
                { submissionError && ! email && <div className="error">Email is required.</div> }
                { requestError }
            </div>
            <div className="user-invite__success">
                { successMessage }
            </div>
        </div>
    )
}

export default UserInvite
