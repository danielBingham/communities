/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
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
