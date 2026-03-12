/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useSelector } from 'react-redux'
import { useLocation, NavLink, Link} from 'react-router-dom'
import { Capacitor } from '@capacitor/core'

import { 
    ArrowLeftIcon as ArrowLeftIconOutline,
    HomeIcon as HomeIconOutline,
    UsersIcon as UsersIconOutline,
    InformationCircleIcon as InformationCircleIconOutline,
    UserGroupIcon as UserGroupIconOutline,
    QueueListIcon as QueueListIconOutline
} from '@heroicons/react/24/outline'
import { 
    ArrowLeftIcon as ArrowLeftIconSolid,
    HomeIcon as HomeIconSolid,
    UsersIcon as UsersIconSolid,
    InformationCircleIcon as InformationCircleIconSolid,
    UserGroupIcon as UserGroupIconSolid,
    QueueListIcon as QueueListIconSolid
} from '@heroicons/react/24/solid'

import CommunitiesLogo from '/components/header/CommunitiesLogo'
import UserMenu from './navigation/UserMenu'
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
    const platform = Capacitor.getPlatform()
    if ( currentUser === null || currentUser === undefined ) {
        return (
            <header>
                <div className="unauthenticated-grid">
                    <CommunitiesLogo />
                    <Link className="nav-link" to="/about">{ location.pathname.startsWith('/about') ? <InformationCircleIconSolid /> : <InformationCircleIconOutline /> }<span className="nav-text">About</span></Link>
                    <UserMenu  />
                </div>
            </header>
        )

    } else {
        return (
            <header>
                <div className="header__authenticated">
                    <div className="header__authenticated__upper">
                        <CommunitiesLogo />
                    </div>
                    <div className="header__authenticated__lower">
                        { platform !== 'web' && <NavLink className="nav-link" to="-1">
                            <ArrowLeftIconSolid className="solid" /><ArrowLeftIconOutline className="outline" /> <span className="nav-text">Back</span>
                        </NavLink> }
                        <NavLink className="nav-link" to="/">
                            <QueueListIconSolid className="solid" /><QueueListIconOutline className="outline" /> <span className="nav-text">Feeds</span>
                        </NavLink>
                        <NavLink className="nav-link" to="/friends">
                            <UsersIconSolid className="solid" /><UsersIconOutline className="outline" /> <span className="nav-text">Friends</span>
                        </NavLink> 
                        <NavLink className="nav-link" to="/groups">
                            <UserGroupIconOutline className="outline" /><UserGroupIconSolid className="solid" /> <span className="nav-text">Groups</span>
                        </NavLink>
                        <NotificationMenu /> 
                        <UserMenu  />
                    </div>
                </div>
            </header>
        )

    }


}

export default Header
