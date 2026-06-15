import React, { useState, useEffect, useId } from 'react'

import './Toggle.css'

const Toggle = function({ onClick, toggled, className, label, explanation, ariaLabel }) {

    const labelId = useId()
    const explanationId = useId()

    const onClickInternal = function(event) {
        event.preventDefault()
        
        onClick(event)
    }


    if ( label || explanation ) {
        return (
            <div className="toggle__wrapper">
                <div className="toggle__label-wrapper">
                    <div id={labelId} className="toggle__label">
                        { label }
                    </div>
                    <div id={explanationId} className="toggle__explanation">
                        { explanation }
                    </div>
                </div>
                <a href=""
                    role="switch"
                    aria-checked={toggled === true}
                    aria-labelledby={label ? labelId : undefined}
                    aria-describedby={explanation ? explanationId : undefined}
                    aria-label={label ? undefined : ariaLabel}
                    onClick={onClickInternal} className={`toggle ${toggled ? 'on' : 'off'} ${className ? className : ''}`}>
                    <span className={`toggle__switch`} aria-hidden="true"></span>
                </a>
            </div>
        )
    } else {
        return (
            <a href=""
                role="switch"
                aria-checked={toggled === true}
                aria-label={ariaLabel}
                onClick={onClickInternal} className={`toggle ${toggled ? 'on' : 'off'} ${className ? className : ''}`}>
                <span className={`toggle__switch`} aria-hidden="true"></span>
            </a>
        )
    }

}

export default Toggle
