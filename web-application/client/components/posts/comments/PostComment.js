import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import Linkify from 'react-linkify'

import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'

import PostCommentDotsMenu from '/components/posts/comments/widgets/PostCommentDotsMenu'

import './PostComment.css'

const PostComment = function({ postId, id }) {
    const [highlight, setHighlight] = useState(false)

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

    const location = useLocation()
    // This is necessary to enable linking to anchors in the page.
    //
    // TODO Techdebt Arguably we could put this on the top level App page...
    useEffect(function() {
        if ( location.hash && location.hash == `#comment-${id}` ) {
            document.querySelector(location.hash).scrollIntoView({
                block: 'center'
            })
            setHighlight(true)
        } else {
            setHighlight(false)
        }
    }, [ id, location ])

    return (
        <div id={`comment-${comment.id}`} key={comment.id} className={`post-comment ${ highlight ? 'highlight' : ''}`}>
            <div className="post-comment__header">
                <div><UserTag id={comment.userId} /> commented <a href={`#comment-${comment.id}`}><DateTag timestamp={comment.createdDate} /></a></div>
                <div className="post-comment__controls">
                    <PostCommentDotsMenu postId={postId} id={id} />
                </div>
            </div>
            <div className="post-comment__content">
                <Linkify>{ comment.content }</Linkify>
            </div>
        </div>
    )
}

export default PostComment
