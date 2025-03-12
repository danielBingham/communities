import React from 'react'
import { NavLink } from 'react-router-dom'

import * as HeroIconsSolid from '@heroicons/react/24/solid'
import * as HeroIconsOutline from '@heroicons/react/24/outline' 

import Button from '/components/generic/button/Button'

import './NavigationMenu.css'

export const NavigationMenu = function({ children, className }) {

    return (
        <div className="navigation-menu">
            <menu className={`navigation-menu__menu ${className ? className : ''}`}>
                { children }
            </menu> 
        </div>
    )
}

export const NavigationMenuItem = function({ to, icon, text, className }) {
    const SolidIcon = HeroIconsSolid[`${icon}Icon`]
    const OutlineIcon = HeroIconsOutline[`${icon}Icon`]

    if ( SolidIcon === undefined || SolidIcon === null ) {
        throw new Error(`Missing icon '${icon}'.`)
    }
    if ( OutlineIcon === undefined || OutlineIcon === null ) {
        throw new Error(`Missing icon '${icon}'.`)
    }

    return (
        <li className={`navigation-menu__item ${className ? className : ''}`}><NavLink to={to} end><SolidIcon className="solid" /><OutlineIcon className="outline" /><span className="nav-text">{ text }</span></NavLink></li>
    )
}

export const NavigationMenuButton = function({ type, onClick, icon, text, className }) {

    const SolidIcon = HeroIconsSolid[`${icon}Icon`]
    const OutlineIcon = HeroIconsOutline[`${icon}Icon`]

    return (
        <li className={`navigation-menu__button ${ className ? className : className }`} ><Button type={type} onClick={onClick}><SolidIcon className="solid" /><OutlineIcon className="outline" /> <span className="nav-text">{ text }</span></Button></li>
    )

}

