import React from 'react'

import './ListHeader.css'

const ListHeader = function({ explanation, className, children }) {

    return (
        <div className={`list__header ${ className ? className : ''}`}>
            <div className="list__header__explanation">{ explanation }</div>
            <div className="list__header__controls">{ children }</div>
        </div>
    )
}

export default ListHeader
