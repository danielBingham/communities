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

import { useEffect, useState, useRef } from 'react'

import './Alert.css'

const Alert = function({ type, timeout, className, children }) {
    const [ visible, setVisible ] = useState(true)

    const timeoutRef = useRef(null)

    useEffect(() => {
        if ( timeout !== undefined && timeout !== null && typeof timeout === 'number' ) {
            timeoutRef.current = setTimeout(() => {
                setVisible(false)
            }, timeout)
        }

        if ( typeof timeout !== 'number' ) {
            throw new Error('Invalid timeout.  Must supply a number.')
        }

        return () => {
            if ( timeoutRef.current !== null ) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [ type, timeout ])

    if ( type !== "success" && type !== "info" && type !== "warn" && type !== "error" ) {
        throw new Error(`Invalid Alert type: "${type}".`)
    }
    
    if ( visible === false ) {
        return null
    }

    return (
        <div 
            className={`alert ${type} ${ className ? className : ''}`} 
            onClick={(e) => setVisible(false)}
        >
            { children }
        </div>
    )

}

export default Alert
