import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { postUsers } from '/state/User'

import Spinner from '/components/Spinner'
import Button from '/components/generic/button/Button'

import './UserInvite.css'

const UserInvite = function() {
    const [ email, setEmail ] = useState('')

    const [ submissionError, setSubmissionError ] = useState('')

    const [request, makeRequest, resetRequest] = useRequest()
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const invite = function(event) {
        event.preventDefault()
        event.stopPropagation()

        if ( ! email ) {
            setSubmissionError('You must enter an email address to invite someone.')
            return
        }


        const trimmedEmail = email.trim()
        const emailTest = trimmedEmail.match(/^\S+@\S+$/)
        if (emailTest === null ) {
            setSubmissionError(`'"${trimmedEmail}" is not a valid email address. Please enter a valid email address.`)
            return 
        }

        makeRequest(postUsers({ email: trimmedEmail}))

        setEmail('')
        setSubmissionError('')
    }

    const onKeyDown = function(event) {
        if ( event.key == 'Enter' ) {
            invite(event)
        } else if ( request ) {
            resetRequest()
        }
    }

    let requestError = null
    let successMessage = null

    if ( ! request || request.state != 'pending' ) {
        if ( request && request.state == 'failed' ) {
            if ( request.error.message) {
                requestError = (
                    <div className="error">
                        { request.error.message }
                    </div>
                )
            } else if ( request.error && request.error.type ) {
                requestError = (
                    <div className="error">
                        Something went wrong: { request.error.type }
                    </div>
                )
            } else {
                requestError = (
                    <div className="error">
                        We encountered an unidentified server error.  Please report this as a bug!
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
                { submissionError !== '' && <div className="error">{ submissionError }</div> }
                { requestError }
            </div>
            <div className="user-invite__success">
                { successMessage }
            </div>
        </div>
    )
}

export default UserInvite
