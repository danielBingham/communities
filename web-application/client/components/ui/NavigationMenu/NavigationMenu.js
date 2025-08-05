import React from 'react'

import './NavigationMenu.css'

export const NavigationMenu = function({ children, className }) {

    return (
        <menu className={`navigation-menu ${className ? className : ''}`}>
            { children }
        </menu> 
    )
}

