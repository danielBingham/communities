import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation, Link } from 'react-router-dom'

import { 
    HomeIcon as HomeIconOutline,
    UsersIcon as UsersIconOutline,
    InformationCircleIcon as InformationCircleIconOutline,
    UserGroupIcon as UserGroupIconOutline
} from '@heroicons/react/24/outline'
import { 
    HomeIcon as HomeIconSolid,
    UsersIcon as UsersIconSolid,
    InformationCircleIcon as InformationCircleIconSolid,
    UserGroupIcon as UserGroupIconSolid
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

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const location = useLocation()

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
