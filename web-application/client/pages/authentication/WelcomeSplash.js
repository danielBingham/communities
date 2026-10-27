import React from 'react'
import { Link } from 'react-router-dom'

import Header from '/components/header/Header'

import LoginForm from '/components/authentication/LoginForm'
import Card from '/components/ui/Card'

import GoogleBadge from '/assets/get-it-on-google-play.png'
import AppleBadge from '/assets/download-from-app-store.svg'

import './WelcomeSplash.css'

const WelcomeSplash = function() {

    return (
        <main id="welcome" className="welcome-splash">
            <Header transparent />
            <div className="welcome-splash__body">
                <div className="welcome-splash__login">
                    <div className="welcome-splash__login-wrapper">
                        <Card className="welcome-splash__login-card">
                            <LoginForm />
                        </Card>
                    </div>
                    <div className="welcome-splash__store-badges">
                        <div className="welcome-splash__store-badge-grid">
                            <a href="https://play.google.com/store/apps/details?id=social.communities" className="welcome-splash__google-store"><img src={GoogleBadge} /></a>
                            <a href="https://apps.apple.com/app/communities-social/id6751424847" className="welcome-splash__apple-store"><img src={AppleBadge} /></a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default WelcomeSplash
