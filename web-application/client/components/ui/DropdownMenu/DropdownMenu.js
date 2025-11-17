import { useState, useEffect, useRef, createContext } from 'react'

export const IsOpenContext = createContext([ false, null ])
export const AutoCloseContext = createContext(false)

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
        document.body.addEventListener('click', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('click', onBodyClick)
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



