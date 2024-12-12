import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import SortControl from '/components/posts/list/controls/SortControl'
import PaginationControls from '/components/PaginationControls'
import PostForm from '/components/posts/form/PostForm'
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

    const editing = JSON.parse(localStorage.getItem('editing'))

    const postViews = []
    for(const postId of query.list) {
        if ( editing !== null && postId in editing ) {
            postViews.push(<PostForm key={postId} postId={postId} />)
        } else {
            postViews.push(<Post key={postId} id={postId} />)
        }
    }

    return (
        <div className="post-list">
            <div className="controls">
                <SortControl /> 
            </div>
            { postViews }
            <PaginationControls meta={query.meta} />
        </div>
    )

}

export default PostList
