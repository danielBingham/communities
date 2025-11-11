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
import { useState, useEffect, useRef, createContext } from 'react'

import * as HeroIconsSolid from '@heroicons/react/24/solid'
import * as HeroIconsOutline from '@heroicons/react/24/outline' 

import { useLocalStorage } from '/lib/hooks/useLocalStorage'

import NavigationMenuItem from './NavigationMenuItem'

import './NavigationSubmenu.css'

export const SubmenuCloseContext = createContext(null)
export const SubmenuIsMobileContext = createContext(false)

const NavigationSubmenu = function({ id, title, icon, children, className }) {
    const [isOpen, setIsOpen] = useLocalStorage(`NavigationSubmenu.${id}.isOpen`, false)
    const [width, setWidth] = useState(window.innerWidth)

    const menuRef = useRef(null)

    const SolidIcon = HeroIconsSolid[`${icon}Icon`]
    const OutlineIcon = HeroIconsOutline[`${icon}Icon`]

    const closeMenu = function() {
        setIsOpen(false)
    }

    useEffect(function() {
        const onBodyClick = function(event) {
            if (menuRef.current && ! menuRef.current.contains(event.target) && width <= 1220 ) 
            {
                setIsOpen(false)
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ isOpen, menuRef])

    useEffect(() => {
        const handleWindowResize = () => setWidth(window.innerWidth)

        window.addEventListener('resize', handleWindowResize)

        return () => {
            window.removeEventListener('resize', handleWindowResize)
        }
    }, [])

    useEffect(() => {
        if ( width <= 1220 ) {
            closeMenu()
        }
    }, [ width ])

    if ( ! SolidIcon || ! OutlineIcon ) {
        throw new Error(`Missing icon! ${icon} does not appear to be a valid icon.`)
    }


    return (
        <NavigationMenuItem className={`navigation-menu__sub-menu ${ className ? className : '' }`}>
            <a href="" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen( ! isOpen )}} className="navigation-menu__sub-menu__header">
                { isOpen ? <SolidIcon /> : <OutlineIcon /> } <span className="nav-text">{ title }</span>
            </a>
            { isOpen && <menu ref={menuRef} className="navigation-menu__sub-menu__menu">
                <SubmenuCloseContext.Provider value={closeMenu}>
                    <SubmenuIsMobileContext.Provider value={width <= 1220}>
                        { children }
                    </SubmenuIsMobileContext.Provider>
                </SubmenuCloseContext.Provider>
            </menu> }
        </NavigationMenuItem>
    )
}

export default NavigationSubmenu
