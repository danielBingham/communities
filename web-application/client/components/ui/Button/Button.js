import React from 'react'
import { useNavigate } from 'react-router-dom'

import './Button.css'

const Button = function({ type, href, disabled, className, onClick, children }) {

    const navigate = useNavigate()

    const onClickInternal = function(event) {
        if ( disabled ) {
            return
        }

        if ( href ) {
            navigate(href)
            return
        }

        if ( onClick ) {
            event.preventDefault()
            onClick(event)
            return
        }
    }

    return (
        <button
            className={`button ${ type ? type : 'default' } ${ className ? className : '' }`} 
            onClick={onClickInternal}
            disabled={disabled}
        >
            { children }
        </button>
    )
}

export default Button
