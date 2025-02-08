import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getPosts } from '/state/posts'

import PostList from '/components/posts/list/PostList'

import './GroupFeed.css'

const GroupFeed = function({ id }) {
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

        makeRequest(getPosts('GroupFeed', { groupId: id, sort: sort }))
    }, [ id ])

    useEffect(function() {
        let sort = searchParams.get('sort') 
        if ( ! sort ) {
            sort = 'newest'
        } 

        makeRequest(getPosts('GroupFeed', { groupId: id, sort: sort }))
    }, [ searchParams ])

    let sort = searchParams.get('sort') 
    if ( ! sort ) {
        sort = 'newest'
    } 

    return (
        <div className="group-feed">
            <div className="group-feed__controls">
                <div className="group-feed__sort-menu">
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
            <PostList queryName="GroupFeed" />
        </div>
    )

}

export default GroupFeed 
