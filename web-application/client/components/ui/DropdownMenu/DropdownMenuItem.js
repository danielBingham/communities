import { useContext } from 'react'

import { CloseMenuContext, AutoCloseContext } from './DropdownMenu'

import './DropdownMenuItem.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenuItem = function({ className, disabled, children, onClick }) {

    const closeMenu = useContext(CloseMenuContext)
    const autoClose = useContext(AutoCloseContext)

    const onClickInternal = function(event) {
        if ( disabled === true ) {
            return
        }

        if ( onClick ) {
            onClick(event); 
        }

        if ( autoClose === true) {
            closeMenu(); 
        }
    }

    // ======= Render ===============================================
 
    let classNameInternal = `dropdown-menu__item ${ className ? className : ''}`    
    if ( disabled === true ) {
        classNameInternal = `dropdown-menu__item dropdown-menu__item__disabled ${ className ? className : ''}`
    } 

    if ( disabled === true ) {
        return (
            <span className={classNameInternal}>{ children }</span>
        )
    } 
    
    return (
        <a
            href=""
            className={classNameInternal}
            onClick={(e) => { e.preventDefault(); onClickInternal(e); }}
        >
            { children }
        </a>
    )

}
