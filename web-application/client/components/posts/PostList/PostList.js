import React from 'react'
import { usePostQuery } from '/lib/hooks/Post'

import PaginationControls from '/components/PaginationControls'
import Post from '/components/posts/Post'
import Spinner from '/components/Spinner'

import PostListSortControl from './PostListSortControl'
import PostListSinceControl from './PostListSinceControl'

import './PostList.css'

const PostList = function({ name, params }) {
    const [query, request] = usePostQuery(params)

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
        postViews.push(<Post key={postId} id={postId} showLoading={true} />)
    }

    let explanation = ''
    if ( parseInt(query.meta.count) === 0 ) {
        explanation = `0 posts`
    } else {
        const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
        const pageEnd = query.meta.count - (query.meta.page-1) * query.meta.pageSize > query.meta.pageSize ? ( query.meta.page * query.meta.pageSize ) : query.meta.count 

        explanation = `${pageStart} to ${pageEnd} of ${query.meta.count} Posts`
    }

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
