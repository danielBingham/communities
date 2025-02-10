import React, {  useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getPosts } from '/state/posts'

import PostList from '/components/posts/list/PostList'
import PostForm from '/components/posts/form/PostForm'

import Spinner from '/components/Spinner'

import './HomeFeed.css'

const HomeFeed = function() {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [request, makeRequest] = useRequest()

    const setSort = function(sortBy) {
        searchParams.set('sort', sortBy)
        setSearchParams(searchParams)
    }

    useEffect(function() {
        let sort = searchParams.get('sort') 
        if ( ! sort ) {
            sort = 'newest'
        } 

        const page = searchParams.get('page') ? searchParams.get('page') : 1
        makeRequest(getPosts('HomeFeed', { sort: sort, page: page }))
    }, [ searchParams ])

    let sort = searchParams.get('sort') 
    if ( ! sort ) {
        sort = 'newest'
    } 

    return (
        <div className="home-feed">
            <PostForm />
            <div className="home-feed__controls">
                <div className="home-feed__sort-menu">
                    <span className="title">Sort By:</span>
                    <a
                        href=""
                        className={`sort-option ${sort == 'newest' ? 'current' : ''}`} 
                        onClick={(e) => {e.preventDefault(); setSort('newest')}}
                    >
                        New 
                    </a>
                    <a
                        href=""
                        className={`sort-option ${sort == 'active' ? 'current' : ''}`}
                        onClick={(e) => {e.preventDefault(); setSort('active')}}
                    >
                        Active 
                    </a>
                </div>
            </div>
            <PostList queryName="HomeFeed" /> 
        </div>
    )

}

export default HomeFeed
