import React, { useId } from 'react'

import './Radio.css'

export const RadioOption = function({ className, name, label, explanation, value, current, onClick }) {
    const inputId = useId()
    const explanationId = useId()

    return (
        <div className={`radio-option ${className ? className : ''}`}>
            <div className="radio-option__label-wrapper">
                <div className="radio-option__label">
                    <label htmlFor={inputId} onClick={onClick}>{ label }</label>
                </div>
                <div id={explanationId} className="radio-option__explanation">
                    { explanation }
                </div>
            </div>
            <div className="radio-option__button">
                <input 
                    type="radio" 
                    id={inputId}
                    name={name} 
                    checked={ current === value }
                    aria-describedby={ explanation ? explanationId : undefined }
                    onChange={onClick}
                    value={ value } />
            </div>
        </div>
    )
}

export const Radio = function({ name, title, explanation, className, children, error }) {
    const titleId = useId()
    const explanationId = useId()
    const errorId = useId()

    return (
        <div className={`radio-button ${className ? className : ''}`}>
            <label id={titleId} htmlFor={name} className="radio-button__label">{ title }</label>
            <p id={explanationId} className="radio-button__explanation">{ explanation }</p>
            <div
                className="radio-button__wrapper"
                role="radiogroup"
                aria-labelledby={ title ? titleId : undefined }
                aria-describedby={`${ explanation ? explanationId : '' } ${ error ? errorId : '' }`.trim() || undefined}
                aria-invalid={ error ? true : undefined }
            >
                { children }
            </div>
            <div id={errorId} className="radio-button__errors">{ error }</div>
        </div>
    )
}
