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
import { useRef, useEffect } from 'react'

import Button from '/components/ui/Button'
import Spinner from '/components/Spinner'

import './AreYouSure.css'

const AreYouSure = function({ isVisible, isPending, cancelLabel = 'Cancel', executeLabel = 'Yes', cancel, execute, className, children }) {
    const ref = useRef(null)
    const overlayRef = useRef(null)

    const isModalScrollable = function() {
        if ( ref.current !== null ) {
            if ( ref.current.scrollHeight > ref.current.clientHeight ) {
                return true
            } 
        }

        return false
    }

    useEffect(() => {
        if ( isVisible === true ) {
            if ( ref.current !== null ) {
                ref.current.focus()
            }
        }
    }, [ isVisible ])

    // Stifle scrolling on the background when the modal is open.
    //
    // TODO This can break scrolling if the contents of the modal change from
    // unscrollable to scrollable.  For now the contents of all these
    // components are static.  If that ever changes we'll need to fix this.
    useEffect(() => {
        // We want to detect taps and trigger the click function when the modal
        // is open.  But we don't want to allow touches to propagate beyond the
        // modal.
        const preventAllScrolling = (event) => {
            event.stopPropagation()
            event.preventDefault()
        }

        const preventScrollPropagation = (event) => {
            event.stopPropagation()
        }

        if ( overlayRef.current !== null ) {
            overlayRef.current.addEventListener('touchmove', preventAllScrolling)
        }


        if ( ref.current !== null && ! isModalScrollable() ) {
            ref.current.addEventListener('touchmove', preventAllScrolling)
        } else if ( ref.current !== null ) {
            ref.current.addEventListener('touchmove', preventScrollPropagation)
        }

        return () => {
            if ( overlayRef.current !== null ) { 
                overlayRef.current.removeEventListener('touchmove', preventAllScrolling)
            }

            if ( ref.current !== null ) {
                ref.current.removeEventListener('touchmove', preventAllScrolling)
                ref.current.removeEventListener('touchmove', preventScrollPropagation)
            }
        }
    }, [ isVisible ])

    return isVisible ?
            <div className="modal-wrapper">
                <div ref={overlayRef} className="modal-overlay" onClick={(e) => { cancel() }} aria-hidden="true"></div>
                <div ref={ref} role="alertdialog" aria-modal="true" tabIndex={-1} className={className ? `are-you-sure ${className}` : 'are-you-sure'}>
                    <div className="are-you-sure__question">{ children }</div>
                    <Button onClick={(e) =>{ e.stopPropagation(); cancel() }}>{ cancelLabel }</Button> <Button type="warn" onClick={(e) => { e.stopPropagation(); execute() }}>{ isPending === true ? <Spinner /> : executeLabel }</Button>
                </div>
            </div>
         : null 
}

export default AreYouSure
