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
import { useParams, Outlet } from 'react-router-dom'

import { useBackPoint } from '/lib/hooks/useBackPoint'
import { useUserByUsername } from '/lib/hooks/User'
import { resetEntities } from '/state/lib'

import Error404 from '/components/errors/Error404'
import { RequestErrorPage } from '/components/errors/RequestError'
import Spinner from '/components/Spinner'

import UserView from '/components/users/UserView'

import Breadcrumbs from '/components/ui/Breadcrumbs'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'
import { NavigationMenu, NavigationMenuLink, NavigationMenuButton, NavigationSubmenu, NavigationSubmenuLink, NavigationMenuItem} from '/components/ui/NavigationMenu'

import './UserProfilePage.css'

const UserProfilePage = function(props) {
    const { slug } = useParams()

    const [user, request] = useUserByUsername(slug)

    useBackPoint(`/${slug}`)

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
        <>
            <Breadcrumbs />
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
        </>
    )
}

export default UserProfilePage
