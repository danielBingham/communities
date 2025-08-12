import React from 'react'

import './List.css'

const List = function({ className, children }) {
    return (
        <div className={`list ${ className ? className : ''}`}>
            { children }
        </div>
    )
}

export default List
