import { useId } from 'react'

import logger from '/logger'

import './TextInput.css'

const TextInput = function({ name, type, label, explanation, className, value, placeholder, ref, onChange, onKeyDown, onBlur, onFocus, error, children }) {

    const id = useId()
    const explanationId = useId()
    const errorId = useId()

    const onChangeInternal = function(event) {
        if ( onChange && typeof onChange === "function") {
            onChange(event)
        } else if ( onChange && typeof onChange !== "function") {
            logger.error("Invalid `onChange` set for TextInput.")
        }
    }

    const onBlurInternal = function(event) {
        if ( onBlur && typeof onBlur === "function") {
            onBlur(event)
        } else if ( onBlur && typeof onBlur !== "function" ) {
            logger.error("Invalid `onBlur` set for TextInput.")
        }
    }

    const onFocusInternal = function(event) {
        if ( onFocus && typeof onFocus === "function" ) {
            onFocus(event)
        } else if ( onFocus && typeof onFocus !== "function" ) {
            logger.error("Invalid `onFocus` set for TextInput.")
        }
    }

    const onKeyDownInternal = function(event) {
        if ( onKeyDown && typeof onKeyDown === "function" ) {
            onKeyDown(event)
        } else if ( onKeyDown && typeof onKeyDown !== "function") {
            logger.error("Invalid `onKeyDown` set for TextInput.")
        }
    }

    if ( value === undefined || value === null ) {
        logger.error(`No value for ${name}.`)
    }

    return (
        <div className={`text-input ${className ? className : ''}`}>
            { label && <label htmlFor={`${name}-${id}`}>{label}</label> }
            { explanation && <p id={explanationId} className="text-input-explanation">{ explanation }</p> }
            <div className="text-input__wrapper">
                <input 
                    ref={ref}
                    type={type} 
                    id={`${name}-${id}`}
                    name={name} 
                    value={value} 
                    placeholder={placeholder}
                    aria-describedby={`${ explanation ? explanationId : '' } ${ error ? errorId : '' }`.trim() || undefined}
                    aria-invalid={ error ? true : undefined }
                    onKeyDown={onKeyDownInternal}
                    onChange={onChangeInternal} 
                    onBlur={onBlurInternal} 
                    onFocus={onFocusInternal} 
                /> 
                <span className="text-input__control">
                    { children }
                </span>
            </div>
            { error && <div id={errorId} className="text-input-error">{ error }</div> }
        </div>
    )

}

export default TextInput
