import React from 'react'

import "./NavigationMenuItem.css"

export const NavigationMenuItem = function({ className, children }) {
    return (
        <li className={`navigation-menu__item ${ className ? className : '' }`}>
            { children }
        </li>
    )
}

