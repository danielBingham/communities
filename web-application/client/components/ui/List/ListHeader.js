import React from 'react'

import './ListHeader.css'

const ListHeader = function({ title, className, children }) {

    return (
        <div className={`list__header ${ className ? className : ''}`}>
            <div className="list__header__title">{ title }</div>
            <div className="list__header__controls">{ children }</div>
        </div>
    )
}

export default ListHeader
