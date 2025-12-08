import { useRef, useState } from 'react'

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'

import TextInput from '../TextInput'

const PasswordInput = function({ name, label, explanation, placeholder, className, value, error, onChange, onKeyDown, onBlur, onFocus }) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)

    const ref = useRef(null)

    const togglePasswordVisibility = function(event) {
        event.preventDefault()
        event.stopPropagation()
        ref.current?.focus()

        setIsPasswordVisible( ! isPasswordVisible)
    }

    let internalType = 'password' 
    if ( isPasswordVisible ) {
        internalType = 'text'
    }

    let passwordControl = (<a href="" onClick={togglePasswordVisibility} className="text-input__show-password"><EyeIcon /></a>)
    if ( isPasswordVisible === true ) {
        passwordControl = (<a href="" onClick={togglePasswordVisibility} className="text-input__show-password"><EyeSlashIcon /></a>)
    } 

    return (
        <TextInput
            name={name}
            type={internalType}
            label={label}
            explanation={explanation}
            className={className}
            value={value}
            placeHolder={placeholder}
            ref={ref}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            onFocus={onFocus}
            error={error}
        >
            { passwordControl }
        </TextInput>
    )
}

export default PasswordInput

