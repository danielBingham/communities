import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { 
    BookOpenIcon
} from '@heroicons/react/24/outline'

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


    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    // ======= Render ===============================================
    
    return (
        <header>
            <div id="site-title"><Link to="/">Communities</Link></div>
            <div id="navigation">
                <MainNavigation />
                { currentUser && <NotificationMenu /> }
                <AuthenticationNavigation />
            </div>
        </header>
    )

}

export default Header
