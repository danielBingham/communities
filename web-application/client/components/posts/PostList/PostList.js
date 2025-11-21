import React from 'react'
import { usePostQuery } from '/lib/hooks/Post'

import { ArrowPathIcon } from '@heroicons/react/24/solid'

import PaginationControls from '/components/PaginationControls'
import Post from '/components/posts/Post'
import Spinner from '/components/Spinner'

import PostListSortControl from './PostListSortControl'
import PostListSinceControl from './PostListSinceControl'

import Button from '/components/ui/Button'
import Refresher from '/components/ui/Refresher'
import RequestErrorContent from '/components/errors/RequestError/RequestErrorContent'

import './PostList.css'

const PostList = function({ name, params }) {
    const [query, request, reset] = usePostQuery(params)

    let postViews = []
    let explanation = ''

    if ( query !== null ) {
        for(const postId of query.list) {
            postViews.push(<Post key={postId} id={postId} showLoading={true} />)
        }

        if ( parseInt(query.meta.count) === 0 ) {
            explanation = `0 posts`
        } else {
            const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
            const pageEnd = query.meta.count - (query.meta.page-1) * query.meta.pageSize > query.meta.pageSize ? ( query.meta.page * query.meta.pageSize ) : query.meta.count 

            explanation = `${pageStart} to ${pageEnd} of ${query.meta.count} Posts`
        }
    } else {
        if ( ! request || request?.state === 'pending' ) {
            explanation = 'Loading posts...'
            postViews = ( <Spinner /> )
        } else if ( request?.state === 'failed' ) {
            postViews = ( <RequestErrorContent message="Attempt to retrieve posts" request={request} /> )
        }
    }



    return (
        <div className="post-list">
            <div className="post-list__header">
                <div className="post-list__header__explanation">{ explanation }</div>
                <div className="post-list__header__controls"> 
                    <Refresher onRefresh={() => reset()} />
                    <Button onClick={(e) => reset()}><ArrowPathIcon /> <span className="nav-text">Refresh</span></Button> 
                    <PostListSinceControl /> 
                    <PostListSortControl /></div>
            </div>
            <div className="post-list__posts">
                { postViews }
                <PaginationControls meta={query?.meta} />
            </div>
        </div>
    )

}

export default PostList
