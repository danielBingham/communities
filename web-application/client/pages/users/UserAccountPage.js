import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet } from 'react-router-dom'

import { resetEntities } from '/state/lib'

import { NavigationMenu, NavigationMenuLink, NavigationSubmenu, NavigationSubmenuLink } from '/components/ui/NavigationMenu'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'
import './UserAccountPage.css'

const UserAccountPage = function(props) {

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
                        <NavigationSubmenuLink to="/account/notifications" icon="Bell" text="Notifications" />
                        <NavigationSubmenuLink to="/account/danger-zone" icon="ExclamationTriangle" text="Danger Zone" />
                    </NavigationSubmenu>
                </NavigationMenu>
            </PageLeftGutter>
            <PageBody className="content">
                <Outlet /> 
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )

}

export default UserAccountPage
