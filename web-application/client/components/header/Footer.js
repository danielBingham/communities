import React from 'react'
import { useSelector } from 'react-redux'

import './Footer.css'

const Footer = function(props) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( currentUser === null || currentUser === undefined ) {
        return null
    }

    // ======= Render ===============================================
    return (
     <footer>
         <div className="wrapper">
            <div className="explanation-copyright footer__block">
                <p className="explanation">Communities is a non-profit, user-supported social media platform built to help people build community, connect, and organize. It is funded and will be governed by its users.</p>
                <p className="explanation">Communities is <a href="https://github.com/danielbingham/communities">open source</a> under the <a href="https://github.com/danielBingham/communities?tab=AGPL-3.0-1-ov-file">AGPL 3.0 license</a> and it's currently in <a href="/about/faq#beta">Public Beta</a>.</p>
                <p>Site text and design (c) Communities Social, LLC 2024 - 2025</p>
            </div>
            <div className="about-links footer__block">
                <p><a href="/about">about</a></p>
                <p><a href="/about/faq">faq</a></p>
                <p><a href="/about/roadmap">roadmap</a></p>
                <p><a href="/about/contribute">contribute</a></p>
                <p><a href="/about/tos">terms of service</a></p>
                <p><a href="/about/privacy">privacy policy</a></p>
                <p><a href="/about/contact">contact</a></p>
            </div>
            <div className="content-links footer__block">
                <p><a href="/">feeds</a></p>
                <p><a href="/friends">friends</a></p>
                <p><a href="/groups">groups</a></p>
            </div>
         </div>
    </footer>
    )

}

export default Footer
