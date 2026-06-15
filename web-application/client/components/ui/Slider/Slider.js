import React from 'react'

const Slider = function({ min, max, value, onChange, ariaLabel }) {
    return (
        <div className="slider">
            <input 
                type="range"
                min={min}
                max={max}
                value={value}
                aria-label={ariaLabel}
                onChange={onChange}
            />
        </div>
    )
}

export default Slider
