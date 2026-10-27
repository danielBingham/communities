import React from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'

import logger from '/logger'

import Header from '/components/header/Header'

import LoginForm from '/components/authentication/LoginForm'
import Card from '/components/ui/Card'

import GoogleBadge from '/assets/get-it-on-google-play.png'
import AppleBadge from '/assets/download-from-app-store.svg'

import './WelcomeSplash.css'

const WelcomeSplash = function() {
    const host = useSelector((state) => state.system.host)

    let phoneAppImage = null
    let noGroupIcon = null
    let cancelIcon = null
    let noBillionaires = null
    let workersAndUsers = null
    let donationFunded = null
    try {
        phoneAppImage = new URL('./phone-app-image.png', host)
        noGroupIcon = new URL('./no-group-icon.png', host)
        cancelIcon = new URL('./cancel-icon.svg', host)
        noBillionaires = new URL('./no-billionaires.svg', host)
        workersAndUsers = new URL('./governed.svg', host)
        donationFunded = new URL('./donation-funded.svg', host)
    } catch (error) {
        logger.error(error)
    }

    return (
        <main id="welcome" className="welcome-splash">
            <Header transparent />
            <div className="welcome-splash__body">
                <div className="welcome-splash__intro">
                    <div className="welcome-splash__intro-right">
                        <div className="welcome-splash__intro-heading">
                            A social network
                        </div>
                        <div className="welcome-splash__intro-subheading">
                            you can trust
                        </div>
                        <div className="welcome-splash__intro-bullets">
                            <div className="welcome-splash__intro-bullet">
                                <img src={workersAndUsers?.href} /><span>Governed by users and workers</span>
                            </div>
                            <div className="welcome-splash__intro-bullet">
                                <img src={donationFunded?.href} /><span>Funded by user donations</span>
                            </div>
                            <div className="welcome-splash__intro-bullet">
                                <img src={noBillionaires?.href} /><span>No billionaire control</span>
                            </div>
                            <div className="welcome-splash__intro-bullet">
                                <img src={cancelIcon?.href} /><span>No ads and No tracking</span>
                            </div>
                        </div>
                    </div>
                    <div className="welcome-splash__intro-left">
                        <img className="welcome-splash__phone-app" src={phoneAppImage?.href} />
                    </div>
                </div>
                <div className="welcome-splash__login">
                    <div className="welcome-splash__login-wrapper">
                        <div className="welcome-splash__beta-note">
                             We're currently in Open Beta.  Read our <Link to="/about/faq#beta">FAQ</Link> to learn about the beta.
                        </div>
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
