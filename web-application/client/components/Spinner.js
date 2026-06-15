import React from 'react'

import './Spinner.css'

const Spinner = function() {
    return (
        <div className="spinner-container" role="status" aria-label="Loading">
            <div className="spinner-wrapper">
                <div className="spinner" aria-hidden="true"></div>
            </div>
        </div>
    )
}

export default Spinner
