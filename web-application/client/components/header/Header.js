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

    const menuRef = useRef(null)

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const location = useLocation()

    useLayoutEffect(function() {
        setWindowWidth(window.innerWidth)

        const handleWindowSizeChange = function() {
            setWindowWidth(window.innerWidth)
        }

        window.addEventListener('resize', handleWindowSizeChange)
        return function cleanup() {
            window.removeEventListener('resize', handleWindowSizeChange)
        }

    }, [])

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

    if ( windowWidth >= 1000) {
        return (
            <header>
                <div className="grid">
                    <div id="site-title"><a href="/"><img src="/favicon-32x32.png" />ommunities</a></div>
                    <div id="navigation">
                        <div id="about-navigation" className="navigation-block">
                            <a href="/">{ location.pathname == '/' ? <HomeIconSolid /> : <HomeIconOutline /> }Home</a>
                            <Link to="/about">{ location.pathname == '/about' ? <InformationCircleIconSolid /> : <InformationCircleIconOutline /> }About</Link>
                            { currentUser && <Link to="/friends">{ location.pathname.startsWith('/friends') ? <UsersIconSolid /> : <UsersIconOutline /> }Friends</Link> }
                        </div>
                        { currentUser && <NotificationMenu /> }
                        <AuthenticationNavigation  />
                    </div>
                </div>
            </header>
        )
    } else {
        return (
            <header className="mobile" ref={menuRef}>
                <div className="grid">
                    <div id="site-title"><Link to="/"><img src="/favicon-32x32.png" /><span className="title-text">ommunities</span></Link></div>
                    <div id="navigation">
                        <div id="about-navigation" className="navigation-block">
                            <a href="/">{ location.pathname == '/' ? <HomeIconSolid /> : <HomeIconOutline /> }<span className="nav-text">Home</span></a>
                            <Link to="/about" >{ location.pathname.startsWith('/about') ? <InformationCircleIconSolid /> : <InformationCircleIconOutline /> }<span className="nav-text">About</span></Link>
                            { currentUser && <Link to="/friends">{ location.pathname.startsWith('/friends') ? <UsersIconSolid /> : <UsersIconOutline /> }<span className="nav-text">Friends</span></Link> }
                        </div>
                        { currentUser && <NotificationMenu /> }
                        <AuthenticationNavigation  />
                        </div>
                    </div>
            </header>
        )
        /*return (
            <header className="mobile" ref={menuRef}>
                <div className="grid">
                    <div id="site-title"><Link to="/"><img src="/favicon-32x32.png" /><span className="title-text">ommunities</span></Link></div>
                    <div id="navigation">
                        <div className="navigation-block mobile-menu-trigger">
                            <a href=""  className="no-close" onClick={(e) => {e.preventDefault(); setShowMenu(! showMenu)}}><Bars3Icon /></a>
                        </div>
                    </div>
                </div>
                { showMenu && <div className="mobile-menu" >
                    <div id="about-navigation" className="navigation-block">
                        <Link to="/" onClick={() => setShowMenu(false)}>{ location.pathname == '/' ? <HomeIconSolid /> : <HomeIconOutline /> }<span className="nav-text">Home</span></Link>
                        <Link to="/about" onClick={() => setShowMenu(false)}>{ location.pathname == '/about' ? <InformationCircleIconSolid /> : <InformationCircleIconOutline /> }<span className="nav-text">About</span></Link>
                        { currentUser && <Link to="/friends" onClick={() => setShowMenu(false)}>{ location.pathname.startsWith('/friends') ? <UsersIconSolid /> : <UsersIconOutline /> }<span className="nav-text">Friends</span></Link> }
                    </div>
                    { currentUser && <NotificationMenu setShowMobileMenu={setShowMenu}/> }
                    <AuthenticationNavigation setShowMobileMenu={setShowMenu} />
                </div> }
            </header>
        )*/
    }


}

export default Header
