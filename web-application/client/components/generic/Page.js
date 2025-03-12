import React from 'react'

import './Page.css'

export const Page = function({ id, children }) {
    return (
        <div id={id} className="page">
            { children }
        </div>
    )
}

export const PageLeftGutter = function({ children }) {
    return (
        <div className="page-left-gutter">
            { children }
        </div>
    )
}

export const PageRightGutter = function({ children }) {
    return (
        <div className="page-right-gutter">
            { children }
        </div>
    )
}

export const PageBody = function({ children }) {
    return (
        <div className="page-body">
            { children }
        </div>
    )
}
