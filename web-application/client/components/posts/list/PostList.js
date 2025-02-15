import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getPosts, clearPostQuery } from '/state/posts'

import PaginationControls from '/components/PaginationControls'
import Post from '/components/posts/Post'
import Spinner from '/components/Spinner'

import './PostList.css'

const PostList = function({ name, params }) {

    const [ searchParams, setSearchParams ] = useSearchParams()

    const query = useSelector((state) => name && name in state.posts.queries ? state.posts.queries[name] : null) 

    const [request, makeRequest] = useRequest()

    const setSort = function(sortBy) {
        searchParams.set('sort', sortBy)
        setSearchParams(searchParams)
    }

    const getSort = function() {
        let sort = searchParams.get('sort') 
        if ( ! sort ) {
            sort = 'newest'
        } 
        return sort
    }

    const dispatch = useDispatch()
    useEffect(function() {
        let queryParams = { ...params }

        queryParams.sort = getSort() 

        queryParams.page = searchParams.get('page') ? searchParams.get('page') : 1

        makeRequest(getPosts(name, queryParams))
        return () => {
            dispatch(clearPostQuery({ name: name}))
        }
    }, [ searchParams, params ])

    console.log(query)
    if ( query === null ) {
        return (
            <div className="post-list">
                <Spinner />
            </div>
        )
    }

    const postViews = []
    for(const postId of query.list) {
        postViews.push(<Post key={postId} id={postId} />)
    }

    const sort = getSort()
    return (
        <div className="post-list">
            <div className="post-list__controls">
                <div className="post-list__sort-menu">
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
            <div className="post-list__posts">
                { postViews }
                <PaginationControls meta={query.meta} />
            </div>
        </div>
    )

}

export default PostList
