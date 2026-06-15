import { useContext } from 'react'

import { IsOpenContext, MenuIdContext } from './DropdownMenu'

import './DropdownMenuTrigger.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenuTrigger = function({ className, ariaLabel, children }) {

    const [isOpen, setIsOpen] = useContext(IsOpenContext)
    const menuId = useContext(MenuIdContext)

    // ======= Render ===============================================

    return (
        <div className={`dropdown-menu__trigger ${isOpen ? 'active' : '' } ${className ? className : ''}`} >
            <a href=""
                role="button"
                aria-haspopup="menu"
                aria-expanded={isOpen === true}
                aria-controls={menuId}
                aria-label={ariaLabel}
                onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
            >{ children }</a>
        </div>
    )
}
