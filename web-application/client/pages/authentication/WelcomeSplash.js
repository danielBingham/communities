import React from 'react'
import { Link } from 'react-router-dom'

import LoginForm from '/components/authentication/LoginForm'

import './WelcomeSplash.css'

const WelcomeSplash = function() {

    return (
        <div className="welcome-splash">
            <div className="intro">
                Communities is a <strong>not-for-profit, cooperative social network</strong> designed 
                to help people connect and organize. <br />
                <p>Funded by users. Governed by the people who use and build it.</p>
                <p>No ads. No tracking. No algorithm deciding what you see.</p>
                <p>Just friends and community.</p>
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
