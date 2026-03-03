import logger from '/logger'

import PasswordInput from './PasswordInput'
import DateInput from './DateInput'
import TextInput from './TextInput'

import './Input.css'

const Input = function({ name, type, label, explanation, placeholder, className, value, onChange, onKeyDown, onBlur, onFocus, error }) {

    if ( type === 'password' ) {
        return ( 
            <PasswordInput
                name={name}
                label={label}
                explanation={explanation}
                className={className}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                onFocus={onFocus}
                error={error}
            />
        )
    } else if ( type === 'date' ) {
        return (
            <DateInput
                name={name}
                label={label}
                explanation={explanation}
                className={className}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                onFocus={onFocus}
                error={error}
            />
        )
    } else {
        return (
            <TextInput
                name={name}
                type={type}
                label={label}
                explanation={explanation}
                className={className}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                onFocus={onFocus}
                error={error}
            />
        )
    }
}

export default Input
