import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import PaginationControls from '/components/PaginationControls'
import Post from '/components/posts/Post'
import Spinner from '/components/Spinner'

import './PostList.css'

const PostList = function({ queryName }) {

    const query = useSelector(function(state) {
        if ( queryName in state.posts.queries ) {
            return state.posts.queries[queryName]
        } else {
            return null 
        }
    })


    if ( query === null ) {
        return (
            <div className="post-list">
                <Spinner local={true} />
            </div>
        )
    }

    const postViews = []
    for(const postId of query.list) {
        postViews.push(<Post key={postId} id={postId} />)
    }

    return (
        <div className="post-list">
            <div className="sort-menu">Sort: Active</div>
            { postViews }
            <PaginationControls meta={query.meta} />
        </div>
    )

}

export default PostList
