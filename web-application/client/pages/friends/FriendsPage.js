import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet } from 'react-router-dom'

import { resetEntities } from '/state/lib'

import { NavigationMenu, NavigationMenuLink, NavigationSubmenu, NavigationSubmenuLink, NavigationMenuButton } from '/components/ui/NavigationMenu'
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
                    <NavigationMenuButton href="/friends/invite" type="primary" icon="Plus" text="Invite" /> 
                    <NavigationMenuLink to="/friends" icon="Users" text="Your Friends" />
                    <NavigationSubmenu icon="UserPlus" title="Pending">
                        <NavigationSubmenuLink to="/friends/requests" icon="UserPlus" text="Requests" />
                        <NavigationSubmenuLink to="/friends/invited" icon="Envelope" text="Invitations" />
                    </NavigationSubmenu>
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
