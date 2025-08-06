import React from 'react'

import './Page.css'

export const Page = function({ id, className, children }) {
    return (
        <div id={id} className={`page ${className ? className : ''}`}>
            { children }
        </div>
    )
}

export const PageLeftGutter = function({ id, className, children }) {
    return (
        <div id={id} className={`page-left-gutter ${ className ? className : ''}`}>
            { children }
        </div>
    )
}

export const PageRightGutter = function({ id, className, children }) {
    return (
        <div id={id} className={`page-right-gutter ${ className ? className : ''}`}>
            { children }
        </div>
    )
}

export const PageBody = function({ id, className, children }) {
    return (
        <div id={id} className={`page-body ${ className ? className : ''}`}>
            { children }
        </div>
    )
}
