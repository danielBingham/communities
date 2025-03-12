import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { Page, PageLeftGutter, PageRightGutter, PageBody } from '/components/generic/Page'

import LoginForm from '/components/authentication/LoginForm'

import './LoginPage.css'

const LoginPage = function(props) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const navigate = useNavigate()

    useEffect(function() {
        if ( currentUser ) {
            navigate('/')
        }
    }, [ currentUser])

    return (
        <Page id="login-page">
            <PageLeftGutter></PageLeftGutter>
            <PageBody>
                <LoginForm />
           </PageBody>
            <PageRightGutter></PageRightGutter>
        </Page>
    )
}

export default LoginPage
