import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { startPostCommentEdit } from '/state/postComments'

import PostComment, { PostCommentForm } from '/components/posts/PostComment'

import './PostComments.css'

const PostComments = function({ postId, expanded }) {
    const [showComments, setShowComments] = useState(false)

    const post = useSelector(function(state) {
        if ( postId in state.posts.dictionary ) {
            return state.posts.dictionary[postId]
        } else {
            return null
        }
    })

    const editing = useSelector(function(state) {
        return state.postComments.editing
    })

    const dispatch = useDispatch()

    useEffect(function() {
        if ( expanded ) {
            setShowComments(true)
        }
    }, [])

    useEffect(function() {
        if ( post !== null ) {
            for(const commentId of post.comments) {
                const editDraft = localStorage.getItem(`commentDraft.${postId}.${commentId}`)
                if ( editDraft && ! (commentId in editing)) {
                    dispatch(startPostCommentEdit(commentId))
                    setShowComments(true)
                }
            }

            const draft = localStorage.getItem(`commentDraft.${postId}`)
            if ( draft ) {
                setShowComments(true)
            }
        }
    }, [ postId, post ])

    if ( ! showComments && post && post.comments.length > 0 ) {
        return (
            <div className="post-comments">
                <div className="show-comments">
                    <a href="" onClick={(e) => { e.preventDefault(); setShowComments(true)}}>Show { post.comments.length } comments.</a>
                </div>
            </div>
        )
    }

    let commentViews = []
    if ( post ) {
        for (const commentId of post.comments ) {
            const draftEdit = localStorage.getItem(`commentDraft.${postId}.${commentId}`)
            if ( draftEdit || (commentId in editing) ) {
                commentViews.push(<PostCommentForm key={commentId} postId={postId} commentId={commentId} setShowComments={setShowComments} />)
            } else {
                commentViews.push(<PostComment key={commentId} postId={postId} id={commentId} />)
            }
        }
    }

    return (
        <div className="post-comments">
            { commentViews }
            { showComments && post.comments.length > 0 && <div className="show-comments">
                <a href="" onClick={(e) => { e.preventDefault(); setShowComments(false)}}>Hide { post.comments.length } comments.</a>
            </div> }
            <PostCommentForm postId={postId} setShowComments={setShowComments} /> 
        </div>
    )
}

export default PostComments
