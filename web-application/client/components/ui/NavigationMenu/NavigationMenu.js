import React from 'react'

import './NavigationMenu.css'

const NavigationMenu = function({ children, className }) {

    return (
        <menu className={`navigation-menu ${className ? className : ''}`}>
            { children }
        </menu> 
    )
}

export default NavigationMenu
