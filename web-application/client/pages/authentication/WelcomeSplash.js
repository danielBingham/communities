import React from 'react'
import { Link } from 'react-router-dom'

import LoginForm from '/components/authentication/LoginForm'

import './WelcomeSplash.css'

const WelcomeSplash = function() {

    return (
        <div className="welcome-splash">
            <div className="intro">
                Communities is a user-supported <strong>not-for-profit social network</strong> built 
                to help people build community, connect, and organize. <br />
                <p>We're not taking
                venture capital. We won't show you ads or suggested post spam. We're not selling your
                    data.</p>
                <p>We want to <strong>de-enshittify the internet.</strong></p>
                <div className="beta">
                    We're currently in Open Beta.  Read our <Link to="/about/faq#beta">FAQ</Link> to learn about the beta.
                </div>
            </div>
            <div>
                <LoginForm /> 
            </div>
        </div>
    )
}

export default WelcomeSplash
