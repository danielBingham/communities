import React, { useState, useEffect, useRef, useId, useContext, createContext } from 'react'

import Button from '/components/ui/Button'

import './ButtonWithModal.css'

export const VisibleContext = createContext(false)
export const ToggleModalContext = createContext(null)

// The DOM id of the modal, used to wire the button to the modal it controls
// with `aria-controls`.
export const ModalIdContext = createContext(null)

export const ButtonWithModal = function({ className, children }) {

    // ======= Render State =========================================

    const [visible, setVisible] = useState(false)

    const modalId = useId()

    const modalRef = useRef(null)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================


    // ======= Actions and Event Handling ===========================
    
    const toggleModal = function() {
        setVisible(!visible)
    }


    // ======= Effect Handling ======================================

    useEffect(function() {
        const onBodyClick = function(event) {
            if (modalRef.current && ! modalRef.current.contains(event.target) ) 
            {
                setVisible(false)
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ visible, modalRef])

    // ======= Render ===============================================
    //
    return (
        <div ref={modalRef} className={`button-with-modal ${className ? className : ''} `}>
            <VisibleContext.Provider value={visible}>
                <ToggleModalContext.Provider value={toggleModal}>
                    <ModalIdContext.Provider value={modalId}>
                        { children }
                    </ModalIdContext.Provider>
                </ToggleModalContext.Provider>
            </VisibleContext.Provider>
        </div>
    )
}

export const ModalButton = function({ type, disabled, className, children }) {

    const visible = useContext(VisibleContext)
    const toggleModal = useContext(ToggleModalContext)
    const modalId = useContext(ModalIdContext)

    return (
        <Button
            type={type}
            className={`modal-button ${ type ? type : 'default' } ${ className ? className : '' }`} 
            onClick={(e) => {
                e.preventDefault()

                toggleModal()
            }}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={visible === true}
            aria-controls={modalId}
        >
            { children }
            <div className="arrow-wrapper" aria-hidden="true">
                <div className="arrow">
                </div>
            </div>
        </Button>
    )
}

export const ButtonModal = function({ className, children }) {

    const visible = useContext(VisibleContext)
    const toggleModal = useContext(ToggleModalContext)
    const modalId = useContext(ModalIdContext)

    return (
        <div 
            id={modalId}
            role="dialog"
            aria-hidden={visible !== true}
            className={`button-modal ${className ? className : ''}`}
            style={{ display: (visible ? 'block' : 'none' ) }}
        >
            { children }
        </div>
    )

}


