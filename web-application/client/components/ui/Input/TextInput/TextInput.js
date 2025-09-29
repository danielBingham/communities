import logger from '/logger'

import './TextInput.css'

const TextInput = function({ name, type, label, explanation, className, value, ref, onChange, onKeyDown, onBlur, onFocus, error, children }) {

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
            { label && <label htmlFor={name}>{label}</label> }
            { explanation && <p className="text-input-explanation">{ explanation }</p> }
            <div className="text-input__wrapper">
                <input 
                    ref={ref}
                    type={type} 
                    name={name} 
                    value={value} 
                    onKeyDown={onKeyDownInternal}
                    onChange={onChangeInternal} 
                    onBlur={onBlurInternal} 
                    onFocus={onFocusInternal} 
                /> 
                <span className="text-input__control">
                    { children }
                </span>
            </div>
            { error && <div className="text-input-error">{ error }</div> }
        </div>
    )

}

export default TextInput
