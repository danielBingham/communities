import React from 'react'

import './Checkbox.css'

const Checkbox = function({ className, name, label, explanation, value, error, onClick }) {
    return (
        <div className={`checkbox ${className ? className : ''}`}>
            <div className="checkbox__grid">
                <div className="checkbox__label-wrapper">
                    <div className="checkbox__label">
                        <label htmlFor={name} onClick={onClick}>{ label }</label>
                    </div>
                    <div className="checkbox__explanation">
                        { explanation }
                    </div>
                </div>
                <input 
                    type="checkbox" 
                    name={name} 
                    checked={ value === true }
                    onChange={onClick} />
            </div>
            <div className="checkbox__error">
                { error }
            </div>
        </div>
    )
}

export default Checkbox
