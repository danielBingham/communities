import React from 'react'
import { useSelector } from 'react-redux'

import GroupFeedMenu from '/components/groups/menu/GroupFeedMenu'

import PostForm from '/components/posts/form/PostForm'
import HomeFeed from '/components/feeds/HomeFeed'

import './HomePage.css'

const HomePage = function() {


    return (
        <div id="home-page">
            <div className="home-page__sidebar">
                <menu className="home-page__menu">
                    <li>
                        <GroupFeedMenu />
                    </li>
                </menu>
            </div>
            <div className="content">
                <div className="home-feeds">
                    <div className="content">
                        <div className="feed">
                            <HomeFeed /> 
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage
