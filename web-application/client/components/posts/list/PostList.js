import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { startPostEdit } from '/state/posts'

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

    const editing = useSelector(function(state) {
        return state.posts.editing
    })

    const dispatch = useDispatch()

    // If we refreshed and have posts in progress in local storage,
    // then backfill those posts into redux.
    useEffect(function() {
        if ( query !== null ) {
            for(const postId of query.list) {
                const draft = localStorage.getItem(`draft.${postId}`)
                if ( draft && ! (postId in editing) ) {
                    dispatch(startPostEdit(postId))
                }
            }
        }
    }, [ query ])

    if ( query === null ) {
        return (
            <div className="post-list">
                <Spinner local={true} />
            </div>
        )
    }

    const postViews = []
    for(const postId of query.list) {
        const draft = localStorage.getItem(`draft.${postId}`)
        if ( draft || postId in editing ) {
            postViews.push(<PostForm key={postId} postId={postId} />)
        } else {
            postViews.push(<Post key={postId} id={postId} />)
        }
    }

    return (
        <div className="post-list">
            <div className="controls">
                <SortControl queryName={queryName} /> 
            </div>
            { postViews }
            <PaginationControls meta={query.meta} />
        </div>
    )

}

export default PostList
