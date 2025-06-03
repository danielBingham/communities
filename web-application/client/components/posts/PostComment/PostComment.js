import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import Linkify from 'react-linkify'

import { usePostComment } from '/lib/hooks/PostComment'
import { useSiteModerationForPostComment } from '/lib/hooks/SiteModeration'
import { useFeature } from '/lib/hooks/feature'

import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'

import PostCommentDotsMenu from './PostCommentDotsMenu'
import PostCommentModeration from './PostCommentModeration'

import './PostComment.css'

const PostComment = function({ postId, id }) {
    const [highlight, setHighlight] = useState(false)

    const [comment] = usePostComment(postId, id)
    const [moderation] = useSiteModerationForPostComment(postId, id)
    const hasAdminModeration = useFeature('62-admin-moderation-controls')

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

    if ( comment == null ) {
        return null
    }

    if ( moderation !== null && moderation.status === 'rejected' ) {
        return (
            <div id={`comment-${comment.id}`} key={comment.id} className={`post-comment ${ highlight ? 'highlight' : ''}`}>
                <div className="post-comment__header">
                    <div>
                        <UserTag id={comment.userId} /> commented <a href={`#comment-${comment.id}`}><DateTag timestamp={comment.createdDate} /></a>
                    </div>
                    <div>
                        <PostCommentModeration postId={postId} postCommentId={id} />
                    </div>
                    <div className="post-comment__controls">
                    </div>
                </div>
                <div className="post-comment__content">
                    <div className="post-comment__moderated">
                        <p>Comment removed by moderator.</p>

                        { moderation.reason !== null && moderation.reason.length > 0 && 
                            <p>{ moderation.reason }</p> 
                        }

                    </div>
                </div>
            </div>
        )
    }

    return (
        <div id={`comment-${comment.id}`} key={comment.id} className={`post-comment ${ highlight ? 'highlight' : ''}`}>
            <div className="post-comment__header">
                <div>
                    <UserTag id={comment.userId} /> commented <a href={`#comment-${comment.id}`}><DateTag timestamp={comment.createdDate} /></a>
                </div>
                <div>
                    { hasAdminModeration && <PostCommentModeration postId={postId} postCommentId={id} /> }
                </div>
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
