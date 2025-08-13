import React from 'react'

import './ListGridContent.css'

const ListGridContent = function({ className, children }) {

    return (
        <div className={`list__grid-content ${ className ? className : ''}`}>
            <div className="list__grid-content__grid">
                { children }
            </div>
        </div>
    )
}

export default ListGridContent
