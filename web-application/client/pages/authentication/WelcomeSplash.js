import React from 'react'

import LoginForm from '/components/authentication/LoginForm'

import './WelcomeSplash.css'

const WelcomeSplash = function() {

    return (
        <div className="welcome-splash">
            <div className="intro">
                Communities is a user-supported <strong>not-for-profit social network</strong>.     
                Our goal is to help people build community,
                    connect, and organize. <br />
                <p>We're not taking
                venture capital. We won't show you ads or suggested post spam. We're not selling your
                    data.</p>
                <p>We want to <strong>de-enshittify the internet.</strong></p>
                <div className="beta">
                    We're currently in invite-only beta.  If you have an invite, register through the link in your email.
                </div>
            </div>
            <LoginForm /> 
        </div>
    )
}

export default WelcomeSplash
