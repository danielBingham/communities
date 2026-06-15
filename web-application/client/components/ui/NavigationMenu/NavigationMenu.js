import React from 'react'

import './NavigationMenu.css'

const NavigationMenu = function({ children, className, ariaLabel }) {

    return (
        <menu role="navigation" aria-label={ariaLabel} className={`navigation-menu ${className ? className : ''}`}>
            { children }
        </menu> 
    )
}

export default NavigationMenu
