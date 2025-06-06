import React from 'react'

import './Radio.css'

export const RadioOption = function({ className, name, label, explanation, value, current, onClick }) {
    return (
        <div className={`radio-option ${className ? className : ''}`}>
            <div className="radio-option__label-wrapper">
                <div className="radio-option__label">
                    <label htmlFor={value} onClick={onClick}>{ label }</label>
                </div>
                <div className="radio-option__explanation">
                    { explanation }
                </div>
            </div>
            <div className="radio-option__button">
                <input 
                    type="radio" 
                    name={name} 
                    checked={ current === value }
                    onChange={onClick}
                    value={ value } />
            </div>
        </div>
    )
}

export const Radio = function({ name, title, explanation, className, children, error }) {
    return (
        <div className={`radio-button ${className ? className : ''}`}>
            <label htmlFor={name} className="radio-button__label">{ title }</label>
            <p className="radio-button__explanation">{ explanation }</p>
            <div className="radio-button__wrapper">
                { children }
            </div>
            <div className="radio-button__errors">{ error }</div>
        </div>
    )
}
