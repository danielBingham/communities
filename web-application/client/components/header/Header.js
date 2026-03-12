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

import CommunitiesLogo from '/components/header/CommunitiesLogo'
import UserMenu from './navigation/UserMenu'
import NotificationMenu from '/components/notifications/NotificationMenu'
import NavigationButton from './NavigationButton'

import './Header.css'

/**
 * A component to render the site header.
 *
 * @param {object} props    Standard react props object - empty.
 */
const Header = function(props) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    // ======= Render ===============================================

    if ( currentUser === null || currentUser === undefined ) {
        return (
            <header>
                <div className="header__unauthenticated">
                    <CommunitiesLogo />
                    <NavigationButton to="/about" icon="InformationCircle" text="About" />
                    <UserMenu />
                </div>
            </header>
        )

    } else {
        return (
            <header>
                <div className="header__authenticated">
                    <div className="header__authenticated__upper">
                        <NavigationButton to="-1" icon="ArrowLeft" text="Back" />
                        <CommunitiesLogo className="header__logo" />
                        <NavigationButton to="/search" icon="MagnifyingGlass" text="Search" />
                    </div>
                    <div className="header__authenticated__lower">
                        <NavigationButton to="/" icon="QueueList" text="Feeds" />
                        <NavigationButton to="/friends" icon="Users" text="Friends" />
                        <NavigationButton to="/groups" icon="UserGroup" text="Groups" />
                        <NotificationMenu /> 
                        <UserMenu />
                    </div>
                </div>
            </header>
        )

    }


}

export default Header
