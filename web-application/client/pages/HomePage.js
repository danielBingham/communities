import React, { useState, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'

import { GlobeAltIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

import TagListView from '/components/tags/list/TagListView'
import PostForm from '/components/posts/form/PostForm'
import PostList from '/components/posts/list/PostList'

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
                <TagListView />
            </div>
            <div className="content">
                <PostForm />
                <div className="posts">
                    <PostList /> 
                </div>
            </div>
            <div className="right-sidebar">
                <div className="places">
                    <h2><GlobeAltIcon /> Places</h2>
                    <ul>
                        <li><a href="?feed=bloomington">Bloomington</a></li>
                        <li><a href="?feed=bloomington">Monroe County</a></li>
                        <li><a href="?feed=bloomington">Indiana</a></li>
                        <li><a href="?feed=bloomington">United States</a></li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default HomePage
