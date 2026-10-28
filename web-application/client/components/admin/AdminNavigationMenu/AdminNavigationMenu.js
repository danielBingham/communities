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

import can, { Actions, Entities } from '/lib/permission'

import { NavigationMenu, NavigationMenuLink, NavigationMenuButton, NavigationSubmenu, NavigationSubmenuLink } from '/components/ui/NavigationMenu'

/**
 * The navigation menu for the admin pages (/admin).
 *
 * Site moderators and admins may use the admin pages.  Writing News and
 * managing feature flags are for site admins only.
 */
const AdminNavigationMenu = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)
    const canAdminSite = can(currentUser, Actions.admin, Entities.Site)

    if ( canModerateSite !== true ) {
        return null
    }

    return (
        <NavigationMenu className="admin-navigation-menu" ariaLabel="Admin">
            { canAdminSite === true && <NavigationMenuButton href="/admin/news/create" icon="Plus" type="primary" text="New Post" /> }
            <NavigationMenuLink to="/admin" icon="ChartBar" text="Dashboard" />
            <NavigationMenuLink to="/admin/moderation" icon="Flag" text="Moderation" />
            <NavigationMenuLink to="/admin/users" icon="Users" text="Users" />
            <NavigationSubmenu id="AdminMore" icon="EllipsisHorizontal" title="More">
                <NavigationSubmenuLink to="/admin/blocklist" icon="NoSymbol" text="Blocklist" />
                { canAdminSite === true && <NavigationSubmenuLink to="/admin/features" icon="AdjustmentsHorizontal" text="Features" /> }
            </NavigationSubmenu>
        </NavigationMenu>
    )
}

export default AdminNavigationMenu
