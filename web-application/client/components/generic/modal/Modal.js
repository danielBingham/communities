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
    const timeoutRef = useRef(null)
    const tappingRef = useRef(false)

    const close = function(event) {
        event.preventDefault()

        setIsVisible(false)
    }

    const overlayClicked = function(event) {
        if ( ! noClose ) {
            setIsVisible(false)
        }
    }

    useEffect(() => {
        if ( isVisible === true ) {
            if ( ref.current !== null ) {
                ref.current.focus()
            }
        }
    }, [ isVisible ])

    // Stifle scrolling on the background when the modal is open.
    useEffect(() => {
        // We want to detect taps and trigger the click function when the modal
        // is open.  But we don't want to allow touches to propagate beyond the
        // modal.
        const touchStartHandler = (event) => {
            event.stopPropagation()
            event.preventDefault()

            tappingRef.current = true
            timeoutRef.current = setTimeout(() => {
                tappingRef.current = false
            }, 200)
        }

        const touchStopHandler = (event) => {
            event.stopPropagation()
            event.preventDefault()

            if ( tappingRef.current === true ) {
                tappingRef.current = false
                overlayClicked()

                if ( timeoutRef.current !== null ) {
                    clearTimeout(timeoutRef.current)
                }
            }
        }

        if ( overlayRef.current !== null ) {
            overlayRef.current.addEventListener('touchstart', touchStartHandler)
            overlayRef.current.addEventListener('touchend', touchStopHandler)
        }

        return () => {
            if ( overlayRef.current !== null ) { 
                overlayRef.current.removeEventListener('touchstart', touchStartHandler)
                overlayRef.current.removeEventListener('touchend', touchStopHandler)
            }

            if ( timeoutRef.current !== null ) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [ isVisible ])

    useEffect(() => {
        const preventTouchPropagation = (event) => {
            event.stopPropagation()
        }

        if ( ref.current !== null ) {
            ref.current.addEventListener('touchstart', preventTouchPropagation)
        }

        return () => {
            if ( ref.current !== null ) {
                ref.current.removeEventListener('touchstart', preventTouchPropagation)
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
