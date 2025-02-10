import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getPosts } from '/state/posts'

import PostList from '/components/posts/list/PostList'
import PostForm from '/components/posts/form/PostForm'

import './GroupFeed.css'

const GroupFeed = function({ id, slug }) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [request, makeRequest] = useRequest()

    const setSort = function(sortBy) {
        searchParams.set('sort', sortBy)
        setSearchParams(searchParams)
    }

    useEffect(function() {
        const params = {}
        params.sort = searchParams.get('sort') 
        if ( ! params.sort ) {
            params.sort = 'newest'
        } 

        if ( id ) {
            params.groupId = id
        } else if ( slug ) {
            params.groupSlug = slug
        } else {
            throw new Error('Missing identifier.')
        }

        makeRequest(getPosts('GroupFeed', params))
    }, [ id, slug, searchParams ])

    let sort = searchParams.get('sort') 
    if ( ! sort ) {
        sort = 'newest'
    } 

    return (
        <div className="group-feed">
            <PostForm groupId={id} />
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
