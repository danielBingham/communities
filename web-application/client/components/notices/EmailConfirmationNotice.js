import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { createToken, cleanupRequest } from '/state/authentication'

import Modal from '/components/generic/modal/Modal'
import Button from '/components/generic/button/Button'

const EmailConfirmationNotice = function() {

    const [isVisible, setIsVisible] = useState(true)

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId ) {
            return state.authentication.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dispatch = useDispatch()

    const requestConfirmation = function() {
        console.log('Request confirmation.')
        setRequestId(dispatch(createToken({ type: 'email-confirmation', email: currentUser.email})))
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId])

    return (
        <Modal isVisible={isVisible} setIsVisible={setIsVisible} noClose={true}>
            <p>Please check your email for a confirmation request and follow
                the link within to confirm your address.</p>
            <p>This modal will go away once you've successfully confirmed your
                new email, but until then you will not be able to use the site.
                If you need us to resend the confirmation email, click
                below.</p>
            <p>If you need help, don't hesitate to reach out to <a
            href="mailto:contact@communities.social">contact@communities.social</a>.</p>
            <Button type="primary" onClick={(e) => requestConfirmation()}>Resend Confirmation Email</Button>
            { request && request.state == 'fulfilled' && <p>Confirmation request sent!</p> }
        </Modal>
    )
}

export default EmailConfirmationNotice


