import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'

import { 
    HomeIcon,
    UsersIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { getPosts } from '/state/posts'

import GroupFeedMenu from '/components/groups/menu/GroupFeedMenu'

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
            <div className="home-page__sidebar">
                <menu className="home-page__menu">
                    <li>
                        <a href="/"><HomeIcon /> Home</a>
                    </li>
                    <li>
                        <GroupFeedMenu />
                    </li>
                </menu>
            </div>
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
