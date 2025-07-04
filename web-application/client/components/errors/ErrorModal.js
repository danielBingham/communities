import React, { useState } from 'react'

import Modal from '/components/generic/modal/Modal'
import Button from '/components/generic/button/Button'

import './ErrorModal.css'

const ErrorModal = function({ children } ) {
    const [ isVisible, setIsVisible ] = useState(true)
    return (
        <Modal className="error-modal" isVisible={isVisible} setIsVisible={setIsVisible} hideX={true}>
            <div className="error-modal__wrapper">
                { children }
            </div>
            <div className="error-modal__button">
                <Button type="warn" onClick={() => setIsVisible(false)}>Continue</Button>
            </div>
        </Modal>
    )
}

export default ErrorModal
