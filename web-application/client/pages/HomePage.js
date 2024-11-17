import React, { useState, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'

import { GlobeAltIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

import TagListView from '/components/tags/list/TagListView'
import PostForm from '/components/posts/form/PostForm'
import HomeFeed from '/components/feeds/HomeFeed'

import Spinner from '/components/Spinner'
import Button from '/components/generic/button/Button'

import './HomePage.css'

const HomePage = function(props) {

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    return (
        <div id="home-page">
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

export default HomePage
