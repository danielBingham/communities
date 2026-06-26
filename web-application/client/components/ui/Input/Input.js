import logger from '/logger'

import PasswordInput from './PasswordInput'
import DateInput from './DateInput'
import TextInput from './TextInput'

import './Input.css'

const Input = function({ name, type, label, explanation, placeholder, className, value, maxLength, autocomplete, onChange, onKeyDown, onKeyUp, onBlur, onFocus, error, children }) {

    if ( type === 'password' ) {
        return ( 
            <PasswordInput
                name={name}
                label={label}
                explanation={explanation}
                className={className}
                placeholder={placeholder}
                value={value}
                maxLength={maxLength}
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
    } else if ( children !== undefined && children !== null ) {
        return (
            <TextInput
                name={name}
                type={type}
                label={label}
                explanation={explanation}
                className={className}
                value={value}
                maxLength={maxLength}
                placeholder={placeholder}
                autocomplete={autocomplete}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                onFocus={onFocus}
                error={error}
            >
                { children }
            </TextInput>
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
                maxLength={maxLength}
                placeholder={placeholder}
                autocomplete={autocomplete}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onKeyUp={onKeyUp}
                onBlur={onBlur}
                onFocus={onFocus}
                error={error}
            />
        )
    }
}

export default Input
