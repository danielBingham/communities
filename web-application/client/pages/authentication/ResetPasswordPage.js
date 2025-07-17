import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import CommunitiesLogo from '/components/header/CommunitiesLogo'

import ResetPasswordForm from '/components/authentication/ResetPasswordForm'

import './ResetPasswordPage.css'

const ResetPasswordPage = function() {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const navigate = useNavigate()

    useEffect(() => {
        if ( currentUser ) {
            navigate('/')
        }
    }, [ currentUser ])


    return (
        <div id="reset-password">
            <div className="logo"><CommunitiesLogo /></div>
            <ResetPasswordForm />
        </div>
    )
}

export default ResetPasswordPage
