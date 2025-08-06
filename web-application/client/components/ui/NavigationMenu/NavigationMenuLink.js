import React from 'react'
import { NavLink } from 'react-router-dom'

import * as HeroIconsSolid from '@heroicons/react/24/solid'
import * as HeroIconsOutline from '@heroicons/react/24/outline' 

import NavigationMenuItem from './NavigationMenuItem'

import './NavigationMenuLink.css'

const NavigationMenuLink = function({ to, icon, text, className, onClick }) {
    const SolidIcon = HeroIconsSolid[`${icon}Icon`]
    const OutlineIcon = HeroIconsOutline[`${icon}Icon`]

    if ( SolidIcon === undefined || SolidIcon === null ) {
        throw new Error(`Missing icon '${icon}'.`)
    }
    if ( OutlineIcon === undefined || OutlineIcon === null ) {
        throw new Error(`Missing icon '${icon}'.`)
    }

    return (
        <NavigationMenuItem>
            <NavLink className={`navigation-menu__link ${className ? className : ''}`} to={to} onClick={onClick} end>
                <SolidIcon className="solid" /><OutlineIcon className="outline" /><span className="nav-text">{ text }</span>
            </NavLink>
        </NavigationMenuItem>
    )
}

export default NavigationMenuLink
