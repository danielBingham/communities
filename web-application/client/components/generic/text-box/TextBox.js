import React from 'react'

import './TextBox.css'

const TextBox = function({ label, explanation, name, className, value, onChange, onBlur, onFocus, error }) {

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

    return (
        <div className={`text-box ${className ? className : ''}`}>
            { label && <label htmlFor={name}>{ label }</label> }
            { explanation && <p className="text-box_explanation">{explanation}</p> }
            <textarea name={name} 
                value={value} 
                onChange={onChangeInternal}
                onFocus={onFocusInternal}
                onBlur={onBlurInternal}
            ></textarea>
            { error && <p className="text-box_error">{ error }</p>}
        </div>

    )

}

export default TextBox
