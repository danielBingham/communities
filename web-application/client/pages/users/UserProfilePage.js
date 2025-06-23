import React from 'react'
import { useParams, Outlet } from 'react-router-dom'

import { useUserByUsername } from '/lib/hooks/User'

import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import UserView from '/components/users/UserView'
import Feed from '/components/feeds/Feed'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import './UserProfilePage.css'

const UserProfilePage = function(props) {
    const { slug } = useParams()
  
    const [user, request] = useUserByUsername(slug)

    // ======= Render ===============================================

    if ( ! user && ( ! request || request.state == 'pending') ) {
        return (
            <div id="user-profile-page">
                <Spinner />
            </div>
        )
    } else if ( ! user ) {
        // The request won't failed, because it's a search request.  So it will
        // just return an empty result.
        return (
            <div id="user-profile-page">
                <Error404 />
            </div>
        )
    }

    return (
        <Page id="user-profile-page">
            <PageLeftGutter>
                <UserView id={user.id} />
            </PageLeftGutter>
            <PageBody className='main'>
                <Outlet /> 
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )
}

export default UserProfilePage
