import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'

import PostCommentDotsMenu from '/components/posts/comments/widgets/PostCommentDotsMenu'

import './PostComment.css'

const PostComment = function({ postId, id }) {

    const comment = useSelector(function(state) {
        if ( id in state.postComments.dictionary ) {
            return state.postComments.dictionary[id]
        } else {
            return null
        }
    })

    if ( comment == null ) {
        return null
    }

    return (
        <div key={comment.id} className="post-comment">
            <div className="header">
                <div><UserTag id={comment.userId} /> commented <DateTag timestamp={comment.createdDate} /></div>
                <div className="controls-wrapper">
                    <PostCommentDotsMenu postId={postId} id={id} />
                </div>
            </div>
            <div className="content">
                { comment.content }
            </div>
        </div>
    )
}

export default PostComment
