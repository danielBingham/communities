import React from 'react'

const Slider = function({ min, max, value, onChange}) {
    return (
        <div className="slider">
            <input 
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={onChange}
            />
        </div>
    )
}

export default Slider
