import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, Link } from 'react-router-dom'

import { Bars3Icon } from '@heroicons/react/24/solid'
import { 
    HomeIcon as HomeIconOutline,
    UsersIcon as UsersIconOutline,
    QuestionMarkCircleIcon as QuestionMarkCircleIconOutline,
} from '@heroicons/react/24/outline'
import { 
    HomeIcon as HomeIconSolid,
    UsersIcon as UsersIconSolid,
    QuestionMarkCircleIcon as QuestionMarkCircleIconSolid,
} from '@heroicons/react/24/solid'

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

    const handleMenuLinkClick = function() {
        console.log('Clicked!')
        setShowMenu(false)
    }

    useEffect(function() {
        setWindowWidth(window.innerWidth)

        window.addEventListener('resize', handleWindowSizeChange)
        return function cleanup() {
            window.removeEventListener('resize', handleWindowSizeChange)
        }

    }, [])

    useEffect(function() {
        const anchors = document.querySelectorAll('header a:not(.no-close)')
        for(const anchor of anchors) {
            anchor.addEventListener('click', handleMenuLinkClick) 
        }
        return function cleanup() {
            const anchors = document.querySelectorAll('header a:not(.no-close)')
            for(const anchor of anchors) {
                anchor.removeEventListener('click', handleMenuLinkClick)
            }
        }
    }, [handleMenuLinkClick])

    // ======= Render ===============================================

    const location = useLocation()
    if ( windowWidth >= 1000) {
        return (
            <header>
                <div className="grid">
                    <div id="site-title"><Link to="/"><img src="/favicon-32x32.png" />ommunities</Link></div>
                    <div id="navigation">
                        <div id="about-navigation" className="navigation-block">
                            <Link to="/">{ location.pathname == '/' ? <HomeIconSolid /> : <HomeIconOutline /> }Home</Link>
                            <Link to="/about">{ location.pathname == '/about' ? <QuestionMarkCircleIconSolid /> : <QuestionMarkCircleIconOutline /> }About</Link>
                            { currentUser && <Link to="/friends">{ location.pathname.startsWith('/friends') ? <UsersIconSolid /> : <UsersIconOutline /> }Friends</Link> }
                        </div>
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
                        <div className="navigation-block mobile-menu-trigger">
                            <a href=""  className="no-close" onClick={(e) => {e.preventDefault(); setShowMenu(! showMenu)}}><Bars3Icon /></a>
                        </div>
                    </div>
                </div>
                { showMenu && <div className="mobile-menu">
                    <div id="about-navigation" className="navigation-block">
                        <Link to="/">{ location.pathname == '/' ? <HomeIconSolid /> : <HomeIconOutline /> }<span className="nav-text">Home</span></Link>
                        <Link to="/about">{ location.pathname == '/about' ? <QuestionMarkCircleIconSolid /> : <QuestionMarkCircleIconOutline /> }<span className="nav-text">About</span></Link>
                        { currentUser && <Link to="/friends">{ location.pathname.startsWith('/friends') ? <UsersIconSolid /> : <UsersIconOutline /> }<span className="nav-text">Friends</span></Link> }
                    </div>
                    { currentUser && <NotificationMenu /> }
                    <AuthenticationNavigation />
                </div> }
            </header>
        )
    }


}

export default Header
