import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getPosts, clearPostQuery } from '/state/Post'

import PaginationControls from '/components/PaginationControls'
import Post from '/components/posts/Post'
import Spinner from '/components/Spinner'

import PostListSortControl from './PostListSortControl'
import PostListSinceControl from './PostListSinceControl'

import './PostList.css'

const PostList = function({ name, params }) {

    const [ searchParams, setSearchParams ] = useSearchParams()

    const query = useSelector((state) => name && name in state.Post.queries ? state.Post.queries[name] : null) 

    const [request, makeRequest] = useRequest()

    const getSort = function() {
        let sort = searchParams.get('sort') 
        if ( ! sort ) {
            sort = 'newest'
        } 
        return sort
    }

    const getSince = function() {
        let since = searchParams.get('since')
        if ( ! since ) {
            since = 'always'
        }
        return since
    }

    useEffect(function() {
        let queryParams = { ...params }

        queryParams.sort = getSort() 
        queryParams.since = getSince()

        queryParams.page = searchParams.get('page') ? searchParams.get('page') : 1

        makeRequest(getPosts(name, queryParams))
    }, [ searchParams, params ])

    useEffect(() => {
        if ( ! query ) {
            let queryParams = { ...params }

            queryParams.sort = getSort() 
            queryParams.since = getSince()

            queryParams.page = searchParams.get('page') ? searchParams.get('page') : 1

            makeRequest(getPosts(name, queryParams))
        }
    }, [ searchParams, params, query ])

    if ( query === null ) {
        return (
            <div className="post-list">
                <div className="post-list__header">
                    <div className="post-list__header__explanation"></div>
                    <div className="post-list__header__controls"><PostListSinceControl /> <PostListSortControl /></div>
                </div>
                <div className="post-list__posts">
                    <Spinner />
                </div>
            </div>
        )
    } 
    

    let postViews = []
    for(const postId of query.list) {
        postViews.push(<Post key={postId} id={postId} />)
    }

    let explanation = ''
    if ( parseInt(query.meta.count) === 0 ) {
        explanation = `Showing 0 posts`
    } else {
        const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
        const pageEnd = ( query.meta.page * query.meta.pageSize )

        explanation = `Showing ${pageStart} to ${pageEnd} of ${query.meta.count} Posts`
    }

    const sort = getSort()
    return (
        <div className="post-list">
            <div className="post-list__header">
                <div className="post-list__header__explanation">{ explanation }</div>
                <div className="post-list__header__controls"><PostListSinceControl /> <PostListSortControl /></div>
            </div>
            <div className="post-list__posts">
                { postViews }
                <PaginationControls meta={query.meta} />
            </div>
        </div>
    )

}

export default PostList
