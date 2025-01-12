import React, { useState, useEffect } from 'react'

import './Toggle.css'

const Toggle = function({ onClick, toggled, className, label, explanation }) {

    const onClickInternal = function(event) {
        event.preventDefault()
        
        onClick(event)
    }


    if ( label || explanation ) {
        return (
            <div className="toggle__wrapper">
                <div className="toggle__label-wrapper">
                    <div className="toggle__label">
                        { label }
                    </div>
                    <div className="toggle__explanation">
                        { explanation }
                    </div>
                </div>
                <a href="" onClick={onClickInternal} className={`toggle ${toggled ? 'on' : 'off'} ${className ? className : ''}`}>
                    <span className={`toggle__switch`}></span>
                </a>
            </div>
        )
    } else {
        return (
            <a href="" onClick={onClickInternal} className={`toggle ${toggled ? 'on' : 'off'} ${className ? className : ''}`}>
                <span className={`toggle__switch`}></span>
            </a>
        )
    }

}

export default Toggle
