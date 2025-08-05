import React from 'react'
import { NavLink } from 'react-router-dom'

import * as HeroIconsSolid from '@heroicons/react/24/solid'
import * as HeroIconsOutline from '@heroicons/react/24/outline' 

import './NavigationMenuLink.css'

const NavigationMenuLink = function({ to, icon, text, className }) {
    const SolidIcon = HeroIconsSolid[`${icon}Icon`]
    const OutlineIcon = HeroIconsOutline[`${icon}Icon`]

    if ( SolidIcon === undefined || SolidIcon === null ) {
        throw new Error(`Missing icon '${icon}'.`)
    }
    if ( OutlineIcon === undefined || OutlineIcon === null ) {
        throw new Error(`Missing icon '${icon}'.`)
    }

    return (
        <NavLink className="navigation-menu__link" to={to} end>
            <SolidIcon className="solid" /><OutlineIcon className="outline" /><span className="nav-text">{ text }</span>
        </NavLink>
    )
}

export default NavigationMenuLink
