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
import { createPortal } from 'react-dom'

import logger from '/logger'

import './Alert.css'

const Alert = function({ type, timeout, onClear, className, children }) {
    const [ visible, setVisible ] = useState(true)

    const timeoutRef = useRef(null)

    const clearAlert = function() {
        setVisible(false)
        if ( onClear && typeof onClear === 'function' ) {
            onClear()
        }
    }


    useEffect(() => {
        if ( timeout !== undefined && timeout !== null && typeof timeout === 'number' ) {
            timeoutRef.current = setTimeout(() => {
                clearAlert()
            }, timeout)
        }

        if ( timeout !== undefined && timeout!== null &&  typeof timeout !== 'number' ) {
            logger.error(new Error('Invalid timeout.  Must supply a number.'))
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

    let typeClass = 'alert__info'
    if ( type === 'success' ) {
        typeClass = 'alert__success'
    } else if ( type === 'warn' ) {
        typeClass = 'alert__warn'
    } else if ( type === 'error' ) {
        typeClass = 'alert__error'
    }

    // Try to find a reasonable portal target.  Try to find the `<main>`
    // element first, then fall back to the `#root-layout`, and finally to the
    // `<body>` element.
    let container = document.body
    const mainElements = document.getElementsByTagName('main')
    if ( mainElements.length <= 0 ) {
        const root = document.getElementById('root-layout')
        if ( root !== null && root !== undefined ) {
            container = root
        }
    } else {
        container = mainElements[0]
    }

    // Portal out to a reasonable outer most container if we can.
    if ( container ) {
        return (
            createPortal(<div 
                className={`alert ${typeClass} ${ className ? className : ''}`} 
                role="alert"
                onClick={(e) => clearAlert()}
            >
                { children }
            </div>, container)
        )
    } 

    // Otherwise, we'll just alert where we are!
    else {
        return (
            <div 
                className={`alert ${typeClass} ${ className ? className : ''}`} 
                role="alert"
                onClick={(e) => clearAlert()}
            >
                { children }
            </div>
        )

    }

}

export default Alert
