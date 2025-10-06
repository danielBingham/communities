import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams, useNavigate } from 'react-router-dom'

import { createToken, validateToken } from '/state/tokens'
import { deleteAuthentication } from '/state/authentication'

import { useRequest } from '/lib/hooks/useRequest'

import CommunitiesLogo from '/components/header/CommunitiesLogo'

import Spinner from '/components/Spinner'
import Button from '/components/generic/button/Button'

import LoginForm from '/components/authentication/LoginForm'

import './EmailConfirmationPage.css'

const EmailConfirmationPage = function(props) {
    const [ searchParams, setSearchParams ] = useSearchParams()
    const token = searchParams.get('token')

    const [ request, makeRequest ] = useRequest()
    const [ createTokenRequest, makeCreateTokenRequest ] = useRequest()
    const [ logoutRequest, makeLogoutRequest ] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const navigate = useNavigate()

    const requestNewConfirmationEmail = function() {
        makeCreateTokenRequest(createToken({ type: 'email-confirmation', email: currentUser.email}))
    }

    const logout = function() {
        // Clear local storage so their drafts don't carry over to another
        // login session.
        localStorage.clear()

        makeRequest(deleteAuthentication())
    }

    useEffect(function() {
        if ( token ) {
            makeRequest(validateToken(token, 'email-confirmation'))
        }
    }, [ token ])

    useEffect(function() {
        // If they don't have a token and aren't logged in, just show the login
        // form.
        if ( ! token && ! currentUser || (currentUser && currentUser.status != 'unconfirmed')) {
            navigate('/')
        }
    }, [ currentUser, token ])

    let content = ( <Spinner /> )

    // If they don't have a token and aren't logged in, just show the login
    // form.
    if ( ! token && ! currentUser || (currentUser && currentUser.status == 'invited')) {
        return (
            <Spinner />
        )
    }

    else if ( ! token && currentUser && currentUser.status == 'unconfirmed' ) {
        content = (
            <div className="email-confirmation-page__instructions">
                <p>Please check your email, "{ currentUser.email }", for a confirmation request and follow
                    the link within to confirm your address.</p>
                <p> You can use the button below to send a
                new email if needed. If you need help, don't hesitate to reach out to <a
                href="mailto:contact@communities.social">contact@communities.social</a>.</p>
                <Button type="warn" onClick={() => logout()}>Cancel</Button> <Button type="primary" onClick={(e) => requestNewConfirmationEmail()}>Resend Confirmation Email</Button>
                { createTokenRequest && createTokenRequest.state == 'fulfilled' && <p>Confirmation request sent!</p> }
            </div>
        )

    }

    // If the request succeeded.
    else if ( currentUser && currentUser.status == 'confirmed' ) {
        content = (
            <div className="email-confirmation-page__success">
                <p>Thanks for confirming your email!</p>
                <p>You can return to the home page <a href="/">here</a></p>
            </div>
        )
    }

    // If the request failed, handle errors.
    else if (request && request.state == 'failed' ) {
        content = (
            <div className="email-confirmation-page__failure">
                <p> We were unable to confirm you email.  The token you used may have been invalid or may have expired.</p>
                <p> You can use the button below to send a
                new email if needed. If you need help, don't hesitate to reach out to <a
                href="mailto:contact@communities.social">contact@communities.social</a>.</p>
                <Button type="warn" onClick={() => logout()}>Cancel</Button> <Button type="primary" onClick={(e) => requestNewConfirmationEmail()}>Resend Confirmation Email</Button>
                { createTokenRequest && createTokenRequest.state == 'fulfilled' && <p>Confirmation request sent!</p> }
            </div>
        )
    }
    
    return (
        <div id="email-confirmation-page">
            <div className="logo"><CommunitiesLogo /></div>
                { content }
        </div>
    )

}

export default EmailConfirmationPage
