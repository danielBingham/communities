import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useParams, Outlet } from 'react-router-dom'

import { useUserByUsername } from '/lib/hooks/User'
import { resetEntities } from '/state/lib'

import Error404 from '/components/errors/Error404'
import { RequestErrorPage } from '/components/errors/RequestError'
import Spinner from '/components/Spinner'

import UserView from '/components/users/UserView'
import Feed from '/components/feeds/Feed'

import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'
import { NavigationMenu, NavigationMenuLink, NavigationMenuButton, NavigationSubmenu, NavigationSubmenuLink, NavigationMenuItem} from '/components/ui/NavigationMenu'

import './UserProfilePage.css'

const UserProfilePage = function(props) {
    const { slug } = useParams()
    console.log(`## UserProfilePage(${slug})`)

    const [user, request] = useUserByUsername(slug)

    const dispatch = useDispatch()
    useEffect(() => {
        return () => {
            dispatch(resetEntities())
        }
    }, [])

    // ======= Render ===============================================

    if ( user === undefined )  {
        if ( request?.state === 'failed' ) {
            return (
                <RequestErrorPage id="user-profile-page" message={'Attempt to request User'} request={request} />
            )
        } else {
            return (
                <Page id="user-profile-page">
                    <PageLeftGutter>
                    </PageLeftGutter>
                    <PageBody className='main'>
                        <Spinner />
                    </PageBody>
                    <PageRightGutter>
                    </PageRightGutter>
                </Page>
            )
        }
    } else if ( user === null ) {
        // The request won't failed, because it's a search request.  So it will
        // just return an empty result.
        return (<Error404 />)
    }

    return (
        <Page id="user-profile-page">
            <PageLeftGutter>
                <NavigationMenu className="user-profile-page__menu">
                    <NavigationMenuLink to={`/${user.username}`} icon="QueueList" text="Feed" /> 
                    <NavigationMenuLink to={`/${user.username}/friends`} icon="Users" text="Friends" /> 

                </NavigationMenu>
            </PageLeftGutter>
            <PageBody>
                <Outlet /> 
            </PageBody>
            <PageRightGutter>
                <UserView id={user.id} />
            </PageRightGutter>
        </Page>
    )
}

export default UserProfilePage
