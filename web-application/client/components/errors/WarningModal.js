import React, { useState } from 'react'

import Modal from '/components/generic/modal/Modal'

import './WarningModal.css'

const WarningModal = function({ children } ) {
    const [ isVisible, setIsVisible ] = useState(true)
    return (
        <Modal className="warning-modal" isVisible={isVisible} setIsVisible={setIsVisible}>
            <div className="warning-modal__wrapper">
                { children }
            </div>
        </Modal>
    )
}

export default WarningModal
