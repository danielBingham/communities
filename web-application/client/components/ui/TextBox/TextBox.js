import { useId } from 'react'

import './TextBox.css'

const TextBox = function({ label, explanation, placeholder, name, className, value, onChange, onBlur, onFocus, error }) {

    const explanationId = useId()
    const errorId = useId()

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
            { explanation && <p id={explanationId} className="text-box_explanation">{explanation}</p> }
            <textarea name={name} 
                id={name}
                value={value} 
                aria-describedby={`${ explanation ? explanationId : '' } ${ error ? errorId : '' }`.trim() || undefined}
                aria-invalid={ error ? true : undefined }
                onChange={onChangeInternal}
                onFocus={onFocusInternal}
                onBlur={onBlurInternal}
                placeholder={placeholder}
            ></textarea>
            { error && <p id={errorId} className="text-box_error">{ error }</p>}
        </div>

    )

}

export default TextBox
