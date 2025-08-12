import React from 'react'

import './ListGridContent.css'

const ListGridContent = function({ className, children }) {

    return (
        <div className={`list__grid-content ${ className ? className : ''}`}>
            { children }
        </div>
    )
}

export default ListGridContent
