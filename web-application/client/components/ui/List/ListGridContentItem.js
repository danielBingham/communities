import React from 'react'

import './ListGridContentItem.css'

const ListGridContentItem = function({ children, className }) {

    return (
        <div className={`list__grid-content__item ${className ? className : ''}`}>
            { children }
        </div>
    )
}

export default ListGridContentItem
