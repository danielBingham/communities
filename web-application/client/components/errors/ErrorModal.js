import React, { useState } from 'react'

import Modal from '/components/generic/modal/Modal'

import './ErrorModal.css'

const ErrorModal = function({ children } ) {
    const [ isVisible, setIsVisible ] = useState(true)
    return (
        <Modal className="error" isVisible={isVisible} setIsVisible={setIsVisible}>
            <div className="error__wrapper">
                { children }
            </div>
        </Modal>
    )
}

export default ErrorModal
