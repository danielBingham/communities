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

import logger from '/logger'

import { isNativePlatform } from '/lib/native'

import { useUser } from '/lib/hooks/User'

import { NavigationMenu, NavigationMenuLink, CopyLink, NavigationSubmenu } from '/components/ui/NavigationMenu'

import FlagUserAction from './FlagUserAction'

const UserNavigationMenu = function({ userId }) {

    const appBuild = useSelector((state) => state.system.appBuild)
    const [user, userRequest, reload] = useUser(userId)

    if (  ( user === undefined || user === null ) 
        && ( userRequest === null || userRequest?.state === 'pending' )
    ) {
        return null
    }

    if ( user === undefined || user === null ) {
        logger.error(`User(${userId}) not found in UserNavigationMenu.`)
        return null
    }

    return (
        <NavigationMenu className="user-profile-page__menu">
            <NavigationMenuLink to={`/${user.username}`} icon="QueueList" text="Feed" /> 
            <NavigationMenuLink to={`/${user.username}/friends`} icon="Users" text="Friends" /> 
             <NavigationSubmenu icon="EllipsisHorizontal" title="More">
                 <FlagUserAction userId={user.id} />
                 { ( ! isNativePlatform() || appBuild >= 15 ) && <CopyLink link={`/${user.username}`} /> }
            </NavigationSubmenu>

        </NavigationMenu>
    )
}

export default UserNavigationMenu
