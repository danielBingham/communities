import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getPosts, cleanupRequest } from '/state/posts'

import PostForm from '/components/posts/form/PostForm'
import HomeFeed from '/components/feeds/HomeFeed'
import WelcomeSplash from '/components/about/WelcomeSplash'

import Spinner from '/components/Spinner'

import './HomePage.css'

const HomePage = function(props) {

    const [requestId,setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.posts.requests) {
            return state.posts.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

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
    if ( ! currentUser ) {
        content = (
            <WelcomeSplash />
        )
    } else {
        if ( ! requestId || ! request || request.state !== 'fulfilled' ) {
            content = ( <Spinner /> )
        } else {
            content = (
                <div className="home-feeds">
                    <div className="left-sidebar">
                    </div>
                    <div className="content">
                        <PostForm postId={postInProgressId} />
                        <div className="feed">
                            <HomeFeed /> 
                        </div>
                    </div>
                    <div className="right-sidebar">
                    </div>
                </div>
            )
        }
    }

    return (
        <div id="home-page">
            { content }
        </div>
    )
}

export default HomePage
