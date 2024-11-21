import React, { useEffect } from 'react'

import './AboutPage.css'

const AboutPage = function(props) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView()
        }
    }, [])

    return (
        <div id="about-page">
            Communities is a user-supported <strong>non-profit social network</strong>.     
            Our goal is to help people build community,
            connect, and organize. <br />
            <p>We're not taking
                venture capital. We won't show you ads or suggested post spam. We're not selling your
                data.</p>
            <p>We want to <strong>de-enshitify the internet.</strong></p>
            <div className="beta">
                We're currently in invite-only beta.  If you have an invite, register through the link in your email.
            </div>
        </div>
    )

}

export default AboutPage
