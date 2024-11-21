import React, { useState, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'


import PostForm from '/components/posts/form/PostForm'
import HomeFeed from '/components/feeds/HomeFeed'
import WelcomeSplash from '/components/about/WelcomeSplash'

import Spinner from '/components/Spinner'

import './HomePage.css'

const HomePage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    let content = <Spinner />
    if ( ! currentUser ) {
        content = (
            <WelcomeSplash />
        )
    } else {
        content = (
            <div className="home-feeds">
                <div className="left-sidebar">
                </div>
                <div className="content">
                    <PostForm />
                    <div className="feed">
                        <HomeFeed /> 
                    </div>
                </div>
                <div className="right-sidebar">
                </div>
            </div>
        )
    }

    return (
        <div id="home-page">
            { content }
        </div>
    )
}

export default HomePage
