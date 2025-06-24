import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet } from 'react-router-dom'

import { resetEntities } from '/state/lib'

import { NavigationMenu, NavigationMenuItem } from '/components/generic/NavigationMenu'
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
                    <NavigationMenuItem to="/account/profile" icon="UserCircle" text="Profile" />
                    <NavigationMenuItem to="/account/change-email" icon="Envelope" text="Email" />
                    <NavigationMenuItem to="/account/change-password" icon="LockClosed" text="Password" />
                    <NavigationMenuItem to="/account/contribute" icon="CreditCard" text="Contribution" />
                    <NavigationMenuItem to="/account/settings" icon="Cog8Tooth" text="Settings" />
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
