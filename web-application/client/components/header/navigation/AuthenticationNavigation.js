import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid'

import Button from '/components/generic/button/Button'

import UserProfileImage from '/components/users/UserProfileImage'
import UserMenu from './UserMenu'

import './AuthenticationNavigation.css'

/**
 * Provides an Authentication component to be used in navigation menus.  
 *
 * @param {object} props    Standard React props object - empty.
 */
const AuthenticationNavigation = function(props) {
    
    const [ menuVisible, setMenuVisible ] = useState(false)

    const menuRef = useRef(null)

    // ======= Request Tracking =====================================

    // ======= Redux State ==========================================

    const currentUser = useSelector((state) => state.authentication.currentUser)

    // ======= Actions and Event Handling ===========================

    const navigate = useNavigate()

    const toggleMenu = function(event) {
        event.preventDefault()

        if ( props.setShowMobileMenu && menuVisible) {
            props.setShowMobileMenu(false)
        }

        setMenuVisible( ! menuVisible )
    }

    const clickLogin = function(event) {
        if ( props.setShowMobileMenu ) {
            props.setShowMobileMenu(false)
        }
        navigate('login')
    }

    // ======= Effect Handling ======================================

    useEffect(function() {
        const onBodyClick = function(event) {
            if ( menuRef.current && ! menuRef.current.contains(event.target) ) {
                setMenuVisible(false)
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ menuVisible, menuRef ])

    // ============= Render =======================
    
    if ( currentUser ) {
        return (
            <div ref={menuRef} id="authentication-navigation" className="navigation-block authenticated">
                <span className="logged-in-user">
                    <a href="" className="no-close" onClick={toggleMenu}>
                        <UserProfileImage userId={currentUser.id} />
                        <span className="navigation-text">{ currentUser.name }</span></a></span>
                <UserMenu visible={menuVisible} toggleMenu={toggleMenu} />
            </div>
        )
    } else {
        return (
            <div id="authentication-navigation" className="navigation-block not-authenticated">
                <Button type="secondary" onClick={clickLogin}>Log In</Button>
                { /*<Button type="primary" onClick={(e) => navigate('register')}>Register</Button>*/}
            </div>
        )
    }

}

export default AuthenticationNavigation 
