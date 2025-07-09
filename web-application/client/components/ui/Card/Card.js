import React from 'react'

import './Card.css'

const Card = function({ className, children }) {
    return (
        <div className={`card ${className ? className : ''}`}>
            { children }
        </div>
    )
}

export default Card
