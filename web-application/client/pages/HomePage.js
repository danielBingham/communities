import React from 'react'
import { Outlet } from 'react-router-dom'

import FeedMenu from '/components/feeds/menu/FeedMenu'
import GroupFeedMenu from '/components/groups/menu/GroupFeedMenu'

import './HomePage.css'

const HomePage = function() {


    return (
        <div id="home-page">
            <div className="home-page__sidebar">
                <menu className="home-page__menu">
                    <li>
                        <FeedMenu />
                    </li>
                    <li>
                        <GroupFeedMenu />
                    </li>
                </menu>
            </div>
            <div className="content">
                <div className="feed">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default HomePage
