import React from 'react'

import * as HeroIconsSolid from '@heroicons/react/24/solid'
import * as HeroIconsOutline from '@heroicons/react/24/outline' 

import Button from '/components/generic/button/Button'

import './NavigationMenuButton.css'

export const NavigationMenuButton = function({ type, onClick, icon, text, className }) {

    const SolidIcon = HeroIconsSolid[`${icon}Icon`]
    const OutlineIcon = HeroIconsOutline[`${icon}Icon`]

    return (
        <Button className={`navigation-menu__button ${ className ? className : '' }`} type={type} onClick={onClick}>
            <SolidIcon className="solid" /> <OutlineIcon className="outline" /> <span className="nav-text">{ text }</span>
        </Button>
    )

}


