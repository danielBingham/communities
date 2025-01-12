import React, { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

import { 
    InformationCircleIcon as InformationCircleIconOutline,
    ClipboardDocumentCheckIcon as ClipboardDocumentCheckIconOutline,
    QuestionMarkCircleIcon as QuestionMarkCircleOutline,
    ShieldCheckIcon as ShieldCheckOutline,
    MegaphoneIcon as MegaphoneOutline
} from '@heroicons/react/24/outline'

import {
    InformationCircleIcon as InformationCircleIconSolid,
    ClipboardDocumentCheckIcon as ClipboardDocumentCheckIconSolid,
    QuestionMarkCircleIcon as QuestionMarkCircleSolid,
    ShieldCheckIcon as ShieldCheckSolid,
    MegaphoneIcon as MegaphoneSolid

} from '@heroicons/react/24/solid'


import About from '/components/about/About'
import FrequentlyAskedQuestions from '/components/about/FrequentlyAskedQuestions'
import TermsOfService from '/components/about/TermsOfService'
import Privacy from '/components/about/Privacy'
import Contact from '/components/about/Contact'


import Spinner from '/components/Spinner'

import './AboutPage.css'

const AboutPage = function(props) {

    const { pageTab } = useParams()
   
    // ======= Render =====================================

    const selectedTab = ( pageTab ? pageTab : null)

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'faq' ) {
        content = ( <FrequentlyAskedQuestions /> ) 
    } else if (selectedTab == 'tos' ) {
        content = ( <TermsOfService /> )
    } else if (selectedTab == 'privacy' ) {
        content = ( <Privacy /> ) 
    } else if (selectedTab == 'contact' ) {
        content = ( <Contact /> )
    } else {
        content = ( <About /> )
    }

    return (
        <div id="about-page">
            <ul className="menu">
                <li className={ selectedTab == null ? 'active' : '' }>
                    <Link to="/about">{ selectedTab == null ? <InformationCircleIconSolid/> : <InformationCircleIconOutline/> } <span className="nav-text">About</span></Link>
                </li>
                <li className={ selectedTab == 'faq' ? 'active' : '' }>
                    <Link to="/about/faq">{ selectedTab == 'faq' ? <QuestionMarkCircleSolid/> : <QuestionMarkCircleOutline/> } <span className="nav-text">FAQ</span></Link>
                </li>
                <li className={ selectedTab == 'tos' ? 'active' : '' }>
                    <Link to="/about/tos">{ selectedTab == 'tos' ? <ClipboardDocumentCheckIconSolid/> : <ClipboardDocumentCheckIconOutline/> } <span className="nav-text">Terms</span></Link>
                </li>
                <li className={ selectedTab == 'privacy' ? 'active' : '' }>
                    <Link to="/about/privacy">{ selectedTab == 'privacy' ? <ShieldCheckSolid/> : <ShieldCheckOutline/> } <span className="nav-text">Privacy</span></Link>
                </li>
                <li className={ selectedTab == 'contact' ? 'active' : '' }>
                    <Link to="/about/contact">{ selectedTab == 'contact' ? <MegaphoneSolid/> : <MegaphoneOutline/> } <span className="nav-text">Contact</span></Link>
                </li>
            </ul>
            <div className="content">
                { content }
            </div>
        </div>
    )

}

export default AboutPage
