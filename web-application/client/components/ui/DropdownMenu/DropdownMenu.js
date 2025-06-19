import React, { useState, useEffect, useRef, useContext, createContext, Children } from 'react'

export const VisibleContext = createContext(false)
export const ToggleMenuContext = createContext(null)
export const CloseOnClickContext = createContext(false)

import './DropdownMenu.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenu = function({ children, className, closeOnClick, startVisible }) {

    // ======= Render State =========================================

    const [visible, setVisible] = useState(startVisible === true)

    const menuRef = useRef(null)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================


    // ======= Actions and Event Handling ===========================
    
    const toggleMenu = function() {
        setVisible(!visible)
    }


    // ======= Effect Handling ======================================

    useEffect(function() {
        const onBodyClick = function(event) {
            if (menuRef.current && ! menuRef.current.contains(event.target) ) 
            {
                setVisible(false)
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ visible, menuRef])

    // ======= Render ===============================================
    //

    return (
        <div ref={menuRef} className={`dropdown-menu ${ className ? className : ''}`}>
            <VisibleContext.Provider value={visible}>
                <ToggleMenuContext.Provider value={toggleMenu}>
                    <CloseOnClickContext.Provider value={closeOnClick}>
                        { children }
                    </CloseOnClickContext.Provider>
                </ToggleMenuContext.Provider>
            </VisibleContext.Provider>
        </div>
    )

}

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenuTrigger = function({ className, children }) {

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)


    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================

    // ======= Effect Handling ======================================

    // ======= Render ===============================================

    return (
        <div className={`dropdown-menu__trigger ${visible ? 'active' : '' } ${className ? className : ''}`} >
            <a href="" className="no-close" onClick={(e) => { e.preventDefault(); toggleMenu(); }}>{ children }</a>
        </div>
    )
}

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
export const DropdownMenuBody = function(props) {

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)

    console.log(visible)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================

    // ======= Effect Handling ======================================

    // ======= Render ===============================================
   
    return (
        <div className={`dropdown-menu__body ${ props.className ? props.className : ''}`} style={{ display: (visible ? 'block' : 'none' ) }} >
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

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)


    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================

    // ======= Effect Handling ======================================

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

    // ======= Render State =========================================

    const visible = useContext(VisibleContext)
    const toggleMenu = useContext(ToggleMenuContext)
    const closeOnClick = useContext(CloseOnClickContext)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    // ======= Actions and Event Handling ===========================
    const onClickInternal = function(event) {
        if ( disabled === true ) {
            return
        }
        
        if ( closeOnClick === true) {
            toggleMenu(); 
        }

        if ( onClick ) {
            onClick(event); 
        }
    }

    // ======= Effect Handling ======================================

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

