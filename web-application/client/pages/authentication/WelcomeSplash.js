import React from 'react'
import { Link } from 'react-router-dom'

import LoginForm from '/components/authentication/LoginForm'

import GoogleBadge from './get-it-on-google-play.png'
import './WelcomeSplash.css'

const WelcomeSplash = function() {

    return (
        <div className="welcome-splash">
            <div className="welcome-splash__banner">

            </div>
            <div className="welcome-splash__text">
                <div className="welcome-splash__text-wrapper">
                    <p><a href="/about">Communities</a> is a place built for people, not profit.</p>
                    <p>It is a <strong>cooperative social network</strong> where members guide the direction, support the growth, and help shape how it evolves.</p>
                    <p>No ads. No data mining. <strong>No algorithm in control.</strong></p>
                    <p>Here, <strong>you decide what matters.</strong> It's about connection and community.</p>
                    <div className="welcome-splash__beta">
                        We're currently in Open Beta.  Read our <Link to="/about/faq#beta">FAQ</Link> to learn about the beta.
                    </div>
                </div>
            </div>
            <div className="welcome-splash__login">
                <div className="welcome-splash__login-wrapper">
                    <LoginForm /> 
                </div>
                <div className="welcome-splash__store-badges">
                    <div className="welcome-splash__store-badge-grid">
                        <a href="https://play.google.com/store/apps/details?id=social.communities" className="welcome-splash__google-store"><img src={GoogleBadge} /></a>
                        <span className="welcome-splash__apple-store">iOS Coming Soon!</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WelcomeSplash
