import React from 'react'

import CommunitiesLogo from '/components/header/CommunitiesLogo'

import ResetPasswordForm from '/components/authentication/ResetPasswordForm'

import './ResetPasswordPage.css'

const ResetPasswordPage = function() {

    return (
        <div id="reset-password">
            <div className="logo"><CommunitiesLogo /></div>
            <ResetPasswordForm />
        </div>
    )
}

export default ResetPasswordPage
