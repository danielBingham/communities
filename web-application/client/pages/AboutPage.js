import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'

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

import './AboutPage.css'

const AboutPage = function() {
    return (
        <div id="about-page">
            <menu className="about-page__menu">
                <li><NavLink to="/about" end>
                    <InformationCircleIconSolid className="solid" /><InformationCircleIconOutline className="outline" /> <span className="nav-text">About</span>
                </NavLink></li>
                <li><NavLink to="/about/faq" end>
                    <QuestionMarkCircleSolid className="solid" /><QuestionMarkCircleOutline className="outline" /> <span className="nav-text">FAQ</span>
                </NavLink></li>
                <li><NavLink to="/about/tos" end>
                    <ClipboardDocumentCheckIconSolid className="solid" /><ClipboardDocumentCheckIconOutline className="outline" /> <span className="nav-text">Terms</span>
                </NavLink></li>
                <li><NavLink to="/about/privacy" end>
                    <ShieldCheckSolid className="solid" /><ShieldCheckOutline className="outline" /> <span className="nav-text">Privacy</span>
                </NavLink></li>
                <li><NavLink to="/about/contact">
                    <MegaphoneSolid className="solid" /><MegaphoneOutline className="outline" /> <span className="nav-text">Contact</span>
                </NavLink> </li>
            </menu>
            <div className="content">
                <Outlet /> 
            </div>
        </div>
    )
}

export default AboutPage
