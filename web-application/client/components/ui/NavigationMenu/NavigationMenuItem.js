import React from 'react'

import "./NavigationMenuItem.css"

const NavigationMenuItem = function({ className, children }) {
    return (
        <li className={`navigation-menu__item ${ className ? className : '' }`}>
            { children }
        </li>
    )
}

export default NavigationMenuItem
