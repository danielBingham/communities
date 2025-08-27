import { useContext } from 'react'

import { IsOpenContext } from './DropdownMenu'

import './DropdownMenuTrigger.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenuTrigger = function({ className, children }) {

    const [isOpen, setIsOpen] = useContext(IsOpenContext)

    // ======= Render ===============================================

    return (
        <div className={`dropdown-menu__trigger ${isOpen ? 'active' : '' } ${className ? className : ''}`} >
            <a href="" onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}>{ children }</a>
        </div>
    )
}
