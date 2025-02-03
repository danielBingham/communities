import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {  Link } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getPosts } from '/state/posts'

import { 
    UserGroupIcon 
} from '@heroicons/react/24/outline'

import PostForm from '/components/posts/form/PostForm'
import HomeFeed from '/components/feeds/HomeFeed'

import Spinner from '/components/Spinner'

import './HomePage.css'

const HomePage = function() {

    const [ request, makeRequest ] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const postInProgressId = useSelector((state) => state.posts.inProgress)

    useEffect(function() {
        if ( currentUser ) {
            makeRequest(getPosts('HomePage', { userId: currentUser.id, status: 'writing' }))
        }
    }, [ currentUser ])

    if ( request && request.state == 'failed' ) {
        // TODO Handle error states.
    }


    const inProgress = ! request || request.state !== 'fulfilled'
    return (
        <div id="home-page">
            <menu className="home-page">
                <li>
                    <Link to="/groups"><UserGroupIcon /> <span className="nav-text">Groups</span></Link>
                </li>
            </menu>
            <div className="content">
                <div className="home-feeds">
                    <div className="content">
                        <PostForm postId={postInProgressId} />
                        <div className="feed">
                            { ! inProgress && <HomeFeed /> }
                            { inProgress && <Spinner /> }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage
