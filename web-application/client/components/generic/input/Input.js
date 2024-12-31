import React from 'react'

import './Input.css'

const Input = function({ name, type, label, explanation, className, value, onChange, onBlur, onFocus, error }) {

    const onChangeInternal = function(event) {
        if ( onChange ) {
            onChange(event)
        }

    }

    const onBlurInternal = function(event) {
        if ( onBlur ) {
            onBlur(event)
        }
    }

    const onFocusInternal = function(event) {
        if ( onFocus ) {
            onFocus(event)
        }
    }

    const typeInternal = type == 'password' ? 'password' : 'text'
    return (
        <div className={`text-input ${className ? className : ''}`}>
            { label && <label htmlFor={name}>{label}</label> }
            { explanation && <p className="text-input-explanation">{ explanation }</p> }
            <input 
                type={type} 
                name={name} 
                value={value} 
                onChange={onChangeInternal} 
                onBlur={onBlurInternal} 
                onFocus={onFocusInternal} 
            /> 
            { error && <div className="text-input-error">{ error }</div> }
        </div>
    )

}

export default Input
