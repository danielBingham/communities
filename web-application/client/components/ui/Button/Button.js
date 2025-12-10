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
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import './Button.css'

const Button = function({ type, href, external, disabled, className, onClick, children }) {

    const ref = useRef(null)
    const navigate = useNavigate()

    const onClickInternal = function(event) {
        event.preventDefault()

        if ( disabled ) {
            return
        }

        if ( onClick ) {
            onClick(event)
        }

        if ( href !== undefined && href !== null ) {
            if ( external !== true ) {
                navigate(href)
                return
            } else if ( external === true ) {
                if ( ref.current ) {
                    ref.current.click()
                }
            }
        }
    }

    return (
        <>
            { href !== undefined && external === true && <a 
                href={href} 
                target="_blank"
                ref={ref} 
                style={{ display: 'none' }}
            >{ href }</a> }
            <button
                className={`button ${ type ? type : 'default' } ${ className ? className : '' }`} 
                onClick={onClickInternal}
                disabled={disabled}
            >
                { children }
            </button>
        </>
    )
}

export default Button
