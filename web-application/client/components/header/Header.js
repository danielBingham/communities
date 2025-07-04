import React from 'react'
import { useSelector } from 'react-redux'
import { useLocation, NavLink, Link} from 'react-router-dom'

import { 
    HomeIcon as HomeIconOutline,
    UsersIcon as UsersIconOutline,
    InformationCircleIcon as InformationCircleIconOutline,
    UserGroupIcon as UserGroupIconOutline,
    QueueListIcon as QueueListIconOutline
} from '@heroicons/react/24/outline'
import { 
    HomeIcon as HomeIconSolid,
    UsersIcon as UsersIconSolid,
    InformationCircleIcon as InformationCircleIconSolid,
    UserGroupIcon as UserGroupIconSolid,
    QueueListIcon as QueueListIconSolid
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

    const isFeedPage = location.pathname === '/' || location.pathname.startsWith('/f/') || location.pathname.startsWith('/g/')
    if ( currentUser === null || currentUser === undefined ) {
        return (
            <header>
                <div className="grid">
                    <CommunitiesLogo />
                    <div id="navigation">
                        <div id="about-navigation" className="navigation-block">
                            <Link className="nav-link" to="/about">{ location.pathname.startsWith('/about') ? <InformationCircleIconSolid /> : <InformationCircleIconOutline /> }<span className="nav-text">About</span></Link>
                        </div>
                        <AuthenticationNavigation  />
                    </div>
                </div>
            </header>
        )

    } else {
        return (
            <header>
                <div className="grid">
                    <CommunitiesLogo />
                    <div id="navigation">
                        <div id="primary" className="navigation-block">
                            <NavLink className="nav-link" to="/"><QueueListIconSolid className="solid" /><QueueListIconOutline className="outline" /> <span className="nav-text">Feeds</span></NavLink>
                            <NavLink className="nav-link" to="/friends"><UsersIconSolid className="solid" /><UsersIconOutline className="outline" /> <span className="nav-text">Friends</span></NavLink> 
                            <NavLink className="nav-link" to="/groups"><UserGroupIconOutline className="outline" /><UserGroupIconSolid className="solid" /> <span className="nav-text">Groups</span></NavLink>
                        </div>
                        <div id="notification" className="navigation-block">
                            <NotificationMenu /> 
                        </div>
                        <AuthenticationNavigation  />
                    </div>
                </div>
            </header>
        )

    }


}

export default Header
