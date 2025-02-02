import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, Link } from 'react-router-dom'

import { useAuthentication } from '/lib/hooks/useAuthentication'

import { getPosts, cleanupRequest } from '/state/posts'

import { 
    UserGroupIcon 
} from '@heroicons/react/24/outline'

import PostForm from '/components/posts/form/PostForm'
import HomeFeed from '/components/feeds/HomeFeed'
import WelcomeSplash from '/components/about/WelcomeSplash'

import WelcomeNotice from '/components/notices/WelcomeNotice'

import Spinner from '/components/Spinner'

import './HomePage.css'

const HomePage = function(props) {

    const { pageTab } = useParams()

    const [requestId,setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.posts.requests) {
            return state.posts.requests[requestId]
        } else {
            return null
        }
    })

    const features = useSelector((state) => state.system.features)
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const postInProgressId = useSelector((state) => state.posts.inProgress)

    const dispatch = useDispatch()

    useEffect(function() {
        if ( currentUser ) {
            setRequestId(dispatch(getPosts('HomePage', { userId: currentUser.id, status: 'writing' })))
        }
    }, [ currentUser ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    let content = ( <Spinner /> )
    if ( ! requestId || ! request || request.state !== 'fulfilled' ) {
        content = ( <Spinner /> )
    } else {
        let welcomeNotice = null
        if ( '3-notices' in features && currentUser && ! currentUser.notices?.welcomeNotice ) {
            welcomeNotice = ( <WelcomeNotice /> )
        }

        content = (
            <>
            { welcomeNotice }
            <div className="home-feeds">
                <div className="content">
                    <PostForm postId={postInProgressId} />
                    <div className="feed">
                        <HomeFeed /> 
                    </div>
                </div>
            </div>
            </>
        )
    }


    return (
        <div id="home-page">
            <menu className="home-page">
                <li>
                    <Link to="/groups"><UserGroupIcon /> <span className="nav-text">Groups</span></Link>
                </li>
            </menu>
            <div className="content">
            { content }
            </div>
        </div>
    )
}

export default HomePage
