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
import * as HeroIconsSolid from '@heroicons/react/24/solid'
import * as HeroIconsOutline from '@heroicons/react/24/outline' 

import NavigationMenuItem from './NavigationMenuItem'

import './NavigationMenuAction.css'

const NavigationMenuAction = function({ icon, text, className, onClick }) {
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
            <a className={`navigation-menu__action ${className ? className : ''}`} onClick={onClick}>
                <SolidIcon className="solid" /><OutlineIcon className="outline" /><span className="nav-text">{ text }</span>
            </a>
        </NavigationMenuItem>
    )
}

export default NavigationMenuAction 
