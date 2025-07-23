import React, { useState, useEffect, useRef, useContext, createContext, Children } from 'react'

const IsOpenContext = createContext([ false, null ])
const AutoCloseContext = createContext(false)

export const CloseMenuContext = createContext(null)

import './DropdownMenu.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenu = function({ children, className, autoClose, startIsOpen }) {

    const openState = useState(startIsOpen === true)
    
    const isOpen = openState[0]
    const setIsOpen = openState[1]

    const menuRef = useRef(null)
    
    const closeMenu = function() {
        setIsOpen(false)
    }

    useEffect(function() {
        const onBodyClick = function(event) {
            if (menuRef.current && ! menuRef.current.contains(event.target) ) 
            {
                setIsOpen(false)
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ isOpen, menuRef])

    // ======= Render ===============================================
    //

    return (
        <div ref={menuRef} className={`dropdown-menu ${ className ? className : ''}`}>
            <IsOpenContext.Provider value={openState}>
                <CloseMenuContext.Provider value={closeMenu}>
                    <AutoCloseContext.Provider value={autoClose}>
                        { children }
                    </AutoCloseContext.Provider>
                </CloseMenuContext.Provider>
            </IsOpenContext.Provider>
        </div>
    )

}

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
            <a href="" className="no-close" onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}>{ children }</a>
        </div>
    )
}

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
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenuHeader = function({ title, children }) {

    // ======= Render ===============================================

    return (
        <div className="dropdown-menu__header">
            <div className="dropdown-menu__header-top">
                <div className="dropdown-menu__header-title">{ title }</div>
            </div>
            {  Children.count(children) > 0 && <div className="dropdown-menu__header-bottom">
                { children }
            </div> }
        </div>
    )

}

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

