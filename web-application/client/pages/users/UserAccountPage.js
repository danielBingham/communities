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
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet } from 'react-router-dom'

import { resetEntities } from '/state/lib'

import { useFeature } from '/lib/hooks/feature'

import { NavigationMenu, NavigationMenuLink, NavigationSubmenu, NavigationSubmenuLink } from '/components/ui/NavigationMenu'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'
import './UserAccountPage.css'

const UserAccountPage = function(props) {

    const hasMutualFriends = useFeature('feat-491-mutual-friends')

    const dispatch = useDispatch()
    useEffect(() => {
        return () => {
            dispatch(resetEntities())
        }
    }, [])

    return (
        <Page id="user-account-page">
            <PageLeftGutter>
                <NavigationMenu className="user-account-page__menu">
                    <NavigationMenuLink to="/account/profile" icon="UserCircle" text="Profile" />
                    <NavigationMenuLink to="/account/change-email" icon="Envelope" text="Email" />
                    <NavigationMenuLink to="/account/change-password" icon="LockClosed" text="Password" />
                    <NavigationMenuLink to="/account/contribute" icon="CreditCard" text="Contribution" />
                    <NavigationSubmenu id="UserAccountPage" title="Settings" icon="Cog8Tooth"> 
                        <NavigationSubmenuLink to="/account/preferences" icon="AdjustmentsHorizontal" text="Preferences" />
                        { hasMutualFriends && <NavigationSubmenuLink to="/account/privacy" icon="LockOpen" text="Privacy" /> }
                        <NavigationSubmenuLink to="/account/notifications" icon="Bell" text="Notifications" />
                        <NavigationSubmenuLink to="/account/danger-zone" icon="ExclamationTriangle" text="Danger Zone" />
                    </NavigationSubmenu>
                </NavigationMenu>
            </PageLeftGutter>
            <PageBody>
                <Outlet /> 
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )

}

export default UserAccountPage
