import React from 'react'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { DropdownMenu, DropdownMenuBody, DropdownMenuTrigger, DropdownMenuItem } from '/components/ui/DropdownMenu'
export { CloseMenuContext } from '/components/ui/DropdownMenu'

import './DotsMenu.css'

export const DotsMenu = function({ className, children }) {
    return (
        <DropdownMenu className={`dots-menu ${className ? className : ''}`}>
            <DropdownMenuTrigger><EllipsisHorizontalIcon className="dots-menu__dots" /></DropdownMenuTrigger>
            <DropdownMenuBody>
                { children }
            </DropdownMenuBody>
        </DropdownMenu>
    )
}

export const DotsMenuItem = function({ className, children, onClick }) {
    return (
        <DropdownMenuItem onClick={onClick} className={`dots-menu__item ${ className ? className : ''}`}>
            { children }
        </DropdownMenuItem>
    )
}
