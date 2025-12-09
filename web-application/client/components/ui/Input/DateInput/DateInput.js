
import TextInput from '../TextInput'

import './DateInput.css'

const DateInput = function({ name, label, explanation, className, value, error, placeholder, onChange, onKeyDown, onBlur, onFocus }) {

    return (
        <TextInput
            name={name}
            label={label}
            type="date"
            explanation={explanation}
            className={className}
            value={value}
            placeHolder={placeholder}
            error={error}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            onFocus={onFocus}
        />
    )
}

export default DateInput
