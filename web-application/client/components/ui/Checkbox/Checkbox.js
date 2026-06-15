import React, { useId } from 'react'

import './Checkbox.css'

const Checkbox = function({ className, name, label, explanation, value, error, onClick }) {
    const explanationId = useId()
    const errorId = useId()

    return (
        <div className={`checkbox ${className ? className : ''}`}>
            <div className="checkbox__grid">
                <div className="checkbox__label-wrapper">
                    <div className="checkbox__label">
                        <label htmlFor={name} onClick={onClick}>{ label }</label>
                    </div>
                    <div id={explanationId} className="checkbox__explanation">
                        { explanation }
                    </div>
                </div>
                <input 
                    type="checkbox" 
                    id={name}
                    name={name} 
                    checked={ value === true }
                    aria-describedby={`${ explanation ? explanationId : '' } ${ error ? errorId : '' }`.trim() || undefined}
                    aria-invalid={ error ? true : undefined }
                    onChange={onClick} />
            </div>
            <div id={errorId} className="checkbox__error">
                { error }
            </div>
        </div>
    )
}

export default Checkbox
