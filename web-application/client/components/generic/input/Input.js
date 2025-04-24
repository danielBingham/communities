import React, { useRef, useState } from 'react'
import logger from '/logger'

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'

import './Input.css'

const Input = function({ name, type, label, explanation, className, value, onChange, onBlur, onFocus, error }) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)

    const inputRef = useRef(null)

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

    const togglePasswordVisibility = function(event) {
        event.preventDefault()
        event.stopPropagation()
        inputRef.current?.focus()

        setIsPasswordVisible( ! isPasswordVisible)
    }

    if ( value === undefined || value === null ) {
        logger.error(`No value for ${name}.`)
    }

    let internalType = type
    if ( type === 'password' && isPasswordVisible ) {
        internalType = 'text'
    }
   
    let passwordControl = null
    if ( type === 'password' ) {
        if ( isPasswordVisible === true ) {
            passwordControl = (<a href="" onClick={togglePasswordVisibility} className="text-input__show-password"><EyeSlashIcon /></a>)
        } else {
            passwordControl = (<a href="" onClick={togglePasswordVisibility} className="text-input__show-password"><EyeIcon /></a>)
        }
    }



    return (
        <div className={`text-input ${className ? className : ''}`}>
            { label && <label htmlFor={name}>{label}</label> }
            { explanation && <p className="text-input-explanation">{ explanation }</p> }
            <div className="text-input__wrapper">
                <input 
                    ref={inputRef}
                    type={internalType} 
                    name={name} 
                    value={value} 
                    onChange={onChangeInternal} 
                    onBlur={onBlurInternal} 
                    onFocus={onFocusInternal} 
                /> 
                { passwordControl }
            </div>
            { error && <div className="text-input-error">{ error }</div> }
        </div>
    )

}

export default Input
