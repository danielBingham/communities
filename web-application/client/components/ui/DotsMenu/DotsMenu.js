import React from 'react'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import './DotsMenu.css'

export const DotsMenu = function({ className, children }) {
    return (
        <FloatingMenu className={`dots-menu ${className ? className : ''}`} closeOnClick={true}>
            <FloatingMenuTrigger showArrow={false}><EllipsisHorizontalIcon className="dots-menu__dots" /></FloatingMenuTrigger>
            <FloatingMenuBody>
                { children }
            </FloatingMenuBody>
        </FloatingMenu>
    )
}

export const DotsMenuItem = function({ className, children, onClick }) {
    return (
        <FloatingMenuItem onClick={onClick} className={`dots-menu__item ${ className ? className : ''}`}>
            { children }
        </FloatingMenuItem>
    )
}
