import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { Bars3Icon } from '@heroicons/react/24/solid'

import MainNavigation from './navigation/MainNavigation'
import AuthenticationNavigation from './navigation/AuthenticationNavigation'
import NotificationMenu from '/components/notifications/NotificationMenu'

import './Header.css'

/**
 * A component to render the site header.
 *
 * @param {object} props    Standard react props object - empty.
 */
const Header = function(props) {

    const [windowWidth, setWindowWidth] = useState(1260)
    const [showMenu, setShowMenu] = useState(false)

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const handleWindowSizeChange = function() {
        setWindowWidth(window.innerWidth)
    }

    useEffect(function() {
        setWindowWidth(window.innerWidth)

        window.addEventListener('resize', handleWindowSizeChange)
        return function cleanup() {
            window.removeEventListener('resize', handleWindowSizeChange)
        }
    }, [])

    // ======= Render ===============================================

    if ( windowWidth >= 1260 ) {
        return (
            <header>
                <div className="grid">
                    <div id="site-title"><Link to="/"><img src="/favicon-32x32.png" />ommunities</Link></div>
                    <div id="navigation">
                        <MainNavigation />
                        { currentUser && <NotificationMenu /> }
                        <AuthenticationNavigation />
                    </div>
                </div>
            </header>
        )
    } else {
        return (
            <header className="mobile">
                <div className="grid">
                    <div id="site-title"><Link to="/"><img src="/favicon-32x32.png" />ommunities</Link></div>
                    <div id="navigation">
                        <div className="navigation-block mobile">
                            <a href="" onClick={(e) => {e.preventDefault(); setShowMenu(! showMenu)}}><Bars3Icon /></a>
                        </div>
                    </div>
                </div>
                { showMenu && <div className="mobile-menu">
                    <MainNavigation />
                    { currentUser && <NotificationMenu /> }
                    <AuthenticationNavigation />
                </div> }
            </header>
        )
    }


}

export default Header
