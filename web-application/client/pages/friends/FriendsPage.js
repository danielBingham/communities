import React from 'react'
import { Outlet } from 'react-router-dom'

import { NavigationMenu, NavigationMenuItem } from '/components/generic/NavigationMenu'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import './FriendsPage.css'

const FriendsPage = function() {
    return (
        <Page id="friends-page">
            <PageLeftGutter>
                <NavigationMenu className="friends-page__menu">
                    <NavigationMenuItem to="/friends" icon="Users" text="Your Friends" />
                    <NavigationMenuItem to="/friends/requests" icon="UserPlus" text="Friend Requests" />
                    <NavigationMenuItem to="/friends/find" icon="MagnifyingGlass" text="Find Friends" /> 
                </NavigationMenu>
            </PageLeftGutter>
            <PageBody className="content">
                { <Outlet /> }
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )
}

export default FriendsPage
