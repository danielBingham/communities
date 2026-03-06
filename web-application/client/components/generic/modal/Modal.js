import React from 'react'
import { createPortal } from 'react-dom'

import { XCircleIcon } from '@heroicons/react/16/solid'

import './Modal.css'

const Modal = function({ isVisible, setIsVisible, className, children, noClose, hideX}) {

    const close = function(event) {
        event.preventDefault()

        setIsVisible(false)
    }

    const overlayClicked = function(event) {
        if ( ! noClose ) {
            setIsVisible(false)
        }
    }

    const container = document.getElementById('root-layout')
    return isVisible ? createPortal(
            <div className={`modal-wrapper ${className ? className : ''}`} >
                <div className="modal__overlay" onClick={overlayClicked}></div>
                <div className="modal">
                    { ! noClose && ! hideX && <a href="" onClick={close} className="modal__close"><XCircleIcon /></a> }
                    { children }
                </div>
            </div>,
            container 
        ) : null 
}

export default Modal
