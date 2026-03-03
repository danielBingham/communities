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
import { useContext } from 'react'
import { Link } from 'react-router-dom'

import { CloseMenuContext, AutoCloseContext } from './DropdownMenu'

import './DropdownMenuItem.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenuItem = function({ className, disabled, children, href, onClick }) {

    const closeMenu = useContext(CloseMenuContext)
    const autoClose = useContext(AutoCloseContext)

    const onClickInternal = function(event) {
        if ( disabled === true ) {
            return
        }

        if ( onClick ) {
            onClick(event); 
        }

        if ( autoClose === true) {
            closeMenu(); 
        }
    }

    // ======= Render ===============================================
 
    let classNameInternal = `dropdown-menu__item ${ className ? className : ''}`    
    if ( disabled === true ) {
        classNameInternal = `dropdown-menu__item dropdown-menu__item__disabled ${ className ? className : ''}`
    } 

    if ( disabled === true ) {
        return (
            <span className={classNameInternal}>{ children }</span>
        )
    } 

    if ( href !== undefined && href !== null ) {
        return (
            <Link className={classNameInternal} onClick={onClickInternal} to={href}>{ children }</Link>
        )
    }
    
    return (
        <a
            href=""
            className={classNameInternal}
            onClick={(e) => { e.preventDefault(); onClickInternal(e); }}
        >
            { children }
        </a>
    )

}
