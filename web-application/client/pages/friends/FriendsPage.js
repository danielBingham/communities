import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet } from 'react-router-dom'

import { resetEntities } from '/state/lib'

import { NavigationMenu, NavigationMenuLink, NavigationMenuButton } from '/components/ui/NavigationMenu'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import './FriendsPage.css'

const FriendsPage = function() {

    const dispatch = useDispatch()
    useEffect(() => {
        return () => {
            dispatch(resetEntities())
        }
    }, [])

    return (
        <Page id="friends-page">
            <PageLeftGutter>
                <NavigationMenu>
                    {/* <NavigationMenuButton to="/invite" type="primary" icon="Plus" text="Invite" /> */}
                    <NavigationMenuLink to="/friends" icon="Users" text="Your Friends" />
                    <NavigationMenuLink to="/friends/requests" icon="UserPlus" text="Requests" />
                    <NavigationMenuLink to="/friends/find" icon="MagnifyingGlass" text="Find Friends" /> 
                </NavigationMenu>
            </PageLeftGutter>
            <PageBody>
                { <Outlet /> }
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )
}

export default FriendsPage
