import React, { useLayoutEffect, useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, Link } from 'react-router-dom'

import { Bars3Icon } from '@heroicons/react/24/solid'
import { 
    HomeIcon as HomeIconOutline,
    UsersIcon as UsersIconOutline,
    InformationCircleIcon as InformationCircleIconOutline,
} from '@heroicons/react/24/outline'
import { 
    HomeIcon as HomeIconSolid,
    UsersIcon as UsersIconSolid,
    InformationCircleIcon as InformationCircleIconSolid,
} from '@heroicons/react/24/solid'

import CommunitiesLogo from '/components/header/CommunitiesLogo'
import AuthenticationNavigation from './navigation/AuthenticationNavigation'
import NotificationMenu from '/components/notifications/NotificationMenu'

import './Header.css'

/**
 * A component to render the site header.
 *
 * @param {object} props    Standard react props object - empty.
 */
const Header = function(props) {

    const menuRef = useRef(null)

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const location = useLocation()

    useEffect(function() {
        const onBodyClick = function(event) {
            if (menuRef.current && ! menuRef.current.contains(event.target) ) 
            {
                setShowMenu(false)
            } 
        }
        document.body.addEventListener('mousedown', onBodyClick)

        return function cleanup() {
            document.body.removeEventListener('mousedown', onBodyClick)
        }
    }, [ ])

    // ======= Render ===============================================

    return (
        <header>
            <div className="grid">
                <CommunitiesLogo />
                <div id="navigation">
                    <div id="about-navigation" className="navigation-block">
                        <a href="/">{ location.pathname == '/' ? <HomeIconSolid /> : <HomeIconOutline /> }<span className="nav-text">Home</span></a>
                        <Link to="/about">{ location.pathname.startsWith('/about') ? <InformationCircleIconSolid /> : <InformationCircleIconOutline /> }<span className="nav-text">About</span></Link>
                        { currentUser && <Link to="/friends">{ location.pathname.startsWith('/friends') ? <UsersIconSolid /> : <UsersIconOutline /> }<span className="nav-text">Friends</span></Link> }
                    </div>
                    { currentUser && <NotificationMenu /> }
                    <AuthenticationNavigation  />
                </div>
            </div>
        </header>
    )


}

export default Header
