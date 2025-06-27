import React from 'react'
import { createPortal } from 'react-dom'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './AreYouSure.css'

const AreYouSure = function({ isVisible, isPending, cancel, execute, className, children }) {

    return isVisible ? createPortal(
            <div className="modal-wrapper">
                <div className="modal-overlay" onClick={(e) => cancel()}></div>
                <div className={className ? `are-you-sure ${className}` : 'are-you-sure'}>
                    <div className="are-you-sure__question">{ children }</div>
                    <Button onClick={(e) => cancel() }>Cancel</Button> <Button type="warn" onClick={execute}>{ isPending === true ? <Spinner /> : 'Yes' }</Button>
                </div>
            </div>,
            document.body
        ) : null 
}

export default AreYouSure
