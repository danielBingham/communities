import React, { useState, useEffect, useContext } from 'react'

import NavigationMenuLink from './NavigationMenuLink'
import { SubmenuCloseContext, SubmenuIsMobileContext } from './NavigationSubmenu'

import './NavigationSubmenuLink.css'

const NavigationSubmenuLink = function({ text, icon, className, to }) {

    const closeMenu = useContext(SubmenuCloseContext)
    const isMobile = useContext(SubmenuIsMobileContext)

    const onClick = function(event) {
        if ( isMobile ) {
            closeMenu()
        }
    }

    return  (
        <NavigationMenuLink text={text} icon={icon} className={`navigation-submenu__link ${ className ? className : ''}`} to={to} onClick={onClick} />
    )

}

export default NavigationSubmenuLink
