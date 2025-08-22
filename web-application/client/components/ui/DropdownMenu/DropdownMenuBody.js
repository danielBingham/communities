import { useContext } from 'react'

import { IsOpenContext } from './DropdownMenu'

import './DropdownMenuBody.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenuBody = function(props) {

    const [ isOpen, setIsOpen ] = useContext(IsOpenContext)

    // ======= Render ===============================================
   
    return (
        <div className={`dropdown-menu__body ${ props.className ? props.className : ''}`} style={{ display: (isOpen ? 'block' : 'none' ) }} >
            { props.children }
        </div>
    )
}

/**
 * A modal in the shape and position of the dropdown menu.
 */
export const DropdownMenuModal = function({ className, children }) {
    return (
        <div className={`dropdown-menu__body ${ className ? className : ''}`}>
            { children }
        </div>
    )
}
