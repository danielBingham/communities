import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Modal from '/components/generic/modal/Modal'
import Button from '/components/generic/button/Button'

import './ErrorModal.css'

const ErrorModal = function({ children, href, onContinue } ) {
    const [ isVisible, setIsVisible ] = useState(true)

    const navigate = useNavigate()
    const onClickInternal = function() {
        setIsVisible(false)

        if ( onContinue ) {
            onContinue()
        }

        if ( href ) {
            navigate(href)
        }

    }

    return (
        <Modal className="error-modal" isVisible={isVisible} setIsVisible={setIsVisible} hideX={true} noClose={true}>
            <div className="error-modal__wrapper">
                { children }
            </div>
            <div className="error-modal__button">
                <Button type="warn" onClick={onClickInternal}>Continue</Button>
            </div>
        </Modal>
    )
}

export default ErrorModal
