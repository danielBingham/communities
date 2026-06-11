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
import { createPortal } from 'react-dom'

import { XMarkIcon } from '@heroicons/react/16/solid'

import './Modal.css'

const Modal = function({ isVisible, setIsVisible, className, children, noClose, hideX}) {

    const ref = useRef(null)
    const overlayRef = useRef(null)

    const close = function(event) {
        event.preventDefault()

        setIsVisible(false)
    }

    const overlayClicked = function(event) {
        if ( ! noClose ) {
            setIsVisible(false)
        }
    }

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
    // unscrollable to scrollable.  For now, modals are all static, but if that
    // changes we'll need to fix this.
    useEffect(() => {
        // We want to detect taps and trigger the click function when the modal
        // is open.  But we don't want to allow touches to propagate beyond the
        // modal.
        const preventScrolling = (event) => {
            event.stopPropagation()
            event.preventDefault()
        }

        if ( overlayRef.current !== null ) {
            overlayRef.current.addEventListener('touchmove', preventScrolling)
        }


        if ( ref.current !== null && ! isModalScrollable() ) {
            ref.current.addEventListener('touchmove', preventScrolling)
        }

        return () => {
            if ( overlayRef.current !== null ) { 
                overlayRef.current.removeEventListener('touchmove', preventScrolling)
            }

            if ( ref.current !== null ) {
                ref.current.removeEventListener('touchmove', preventScrolling)
            }
        }
    }, [ isVisible ])

    const container = document.getElementById('root-layout')
    return isVisible ? createPortal(
            <div className={`modal-wrapper ${className ? className : ''}`} >
                <div ref={overlayRef} className="modal__overlay" onClick={overlayClicked}></div>
                <div ref={ref} className="modal">
                    { ! noClose && ! hideX && <a href="" onClick={close} className="modal__close"><XMarkIcon /></a> }
                    { children }
                </div>
            </div>,
            container 
        ) : null 
}

export default Modal
