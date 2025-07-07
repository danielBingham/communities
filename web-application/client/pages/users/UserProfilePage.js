import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useParams, Outlet } from 'react-router-dom'

import { useUserByUsername } from '/lib/hooks/User'
import { resetEntities } from '/state/lib'

import Error404 from '/components/errors/Error404'
import Spinner from '/components/Spinner'

import UserView from '/components/users/UserView'
import Feed from '/components/feeds/Feed'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'

import './UserProfilePage.css'

const UserProfilePage = function(props) {
    const { slug } = useParams()
  
    const [user, request] = useUserByUsername(slug)

    const dispatch = useDispatch()
    useEffect(() => {
        return () => {
            dispatch(resetEntities())
        }
    }, [])

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
            </PageLeftGutter>
            <PageBody className='main'>
                <Outlet /> 
            </PageBody>
            <PageRightGutter>
                <UserView id={user.id} />
            </PageRightGutter>
        </Page>
    )
}

export default UserProfilePage
