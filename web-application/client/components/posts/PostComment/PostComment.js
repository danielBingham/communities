import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { useFeature } from '/lib/hooks/feature'
import { usePost } from '/lib/hooks/Post'
import { usePostComment } from '/lib/hooks/PostComment'
import { useUser } from '/lib/hooks/User'
import { useSiteModeration } from '/lib/hooks/SiteModeration'
import { useGroupModeration } from '/lib/hooks/GroupModeration'
import { usePostLink } from '/lib/hooks/Post'

import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'

import CommentReactions from './CommentReactions'
import PostCommentDotsMenu from './PostCommentDotsMenu'
import PostCommentModeration from './PostCommentModeration'

import TextWithMentions from '/components/posts/TextWithMentions'

import './PostComment.css'

/**
 * @param {object} props
 * @param {string} props.postId
 * @param {string} props.id The id of the comment.
 * @param {function} [props.onReply] Called with the comment author's username
 * when the user clicks "Reply".  The "Reply" link is only shown when this is
 * provided, since there needs to be a comment form to reply in.
 */
const PostComment = function({ postId, id, onReply }) {
    const [highlight, setHighlight] = useState(false)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const hasCommentReactions = useFeature('feat-268-comment-reactions')

    const [post, postRequest] = usePost(postId)
    const [comment, request] = usePostComment(postId, id)

    // Replies mention the comment's author, so we need their username.  The
    // UserTag below queries for the author, so we don't need to query here.
    const [author] = useUser(comment?.userId, { noQuery: true })

    const [siteModeration, siteModerationRequest] = useSiteModeration(comment?.siteModerationId)
    const [groupModeration, groupModerationRequest] = useGroupModeration(post?.groupId, comment?.groupModerationId)
   
    // usePostLink doesn't query, so this won't double query.
    const postLink = usePostLink(postId)

    const location = useLocation()
    // This is necessary to enable linking to anchors in the page.
    //
    // TODO Techdebt Arguably we could put this on the top level App page...
    useEffect(function() {
        if ( comment !== null && comment !== undefined && location.hash && location.hash == `#comment-${id}` ) {
            document.querySelector(location.hash).scrollIntoView({
                block: 'center'
            })
            setHighlight(true)
        } else {
            setHighlight(false)
        }
    }, [ id, location, comment ])

    if ( comment == null 
        || ( comment.siteModerationId !== null && siteModeration === null)
        || ( comment.groupModerationId !== null && groupModeration === null)
        ) 
    {
        return null
    }

    if ( (siteModeration !== null && siteModeration.status === 'rejected') 
        || (groupModeration !== null && groupModeration.status === 'rejected') ) 
    {
        return (
            <div id={`comment-${comment.id}`} key={comment.id} role="article" className={`post-comment ${ highlight ? 'highlight' : ''}`}>
                <div className="post-comment__header">
                    <div>
                        <UserTag id={comment.userId} /> commented <a href={`${postLink}#comment-${comment.id}`}><DateTag timestamp={comment.createdDate} /></a>
                    </div>
                    <div>
                        <PostCommentModeration postId={postId} postCommentId={id} />
                    </div>
                    <div className="post-comment__controls">
                    </div>
                </div>
                <div className="post-comment__content">
                    <div className="post-comment__moderated">
                        { siteModeration && siteModeration.status === 'rejected' && (siteModeration.reason !== null && siteModeration.reason.length > 0) && 
                            <p>Comment removed by a Site moderator with explanation: { siteModeration.reason }</p> 
                        }
                        { siteModeration && siteModeration.status === 'rejected' && (siteModeration.reason === null || siteModeration.reason.length <= 0) &&
                            <p>Comment removed by a Site moderator.</p>
                        }
                        { groupModeration && groupModeration.status === 'rejected' && groupModeration.reason !== null && groupModeration.reason.length > 0 && 
                            <p>Comment removed by a Group moderator with explanation: { groupModeration.reason }</p> 
                        }
                        { groupModeration && groupModeration.status === 'rejected' && (groupModeration.reason === null || groupModeration.reason.length <= 0) &&
                            <p>Comment removed by a Group moderator.</p>
                        }

                    </div>
                </div>
            </div>
        )
    }

    // Replying to yourself would only mention yourself, so we don't offer it.
    // We also can't reply until we know the author's username.
    const canReply = typeof onReply === 'function'
        && currentUser && author && author.id !== currentUser.id

    return (
        <div id={`comment-${comment.id}`} key={comment.id} role="article" className={`post-comment ${ highlight ? 'highlight' : ''}`}>
            <div className="post-comment__header">
                <div>
                    <UserTag id={comment.userId} /> commented <a href={`${postLink}#comment-${comment.id}`}><DateTag timestamp={comment.createdDate} /></a>
                </div>
                <div>
                    { <PostCommentModeration postId={postId} postCommentId={id} /> }
                </div>
                <div className="post-comment__controls">
                    <PostCommentDotsMenu postId={postId} id={id} />
                </div>
            </div>
            <div className="post-comment__content">
                <TextWithMentions text={ comment.content } />
            </div>
            { ( hasCommentReactions || canReply ) && <div className="post-comment__footer">
                { hasCommentReactions && <CommentReactions postId={postId} commentId={id} /> }
                { canReply && <a
                    href=""
                    className="post-comment__reply"
                    aria-label={`Reply to ${author.name}`}
                    onClick={(e) => { e.preventDefault(); onReply(author.username) }}
                >Reply</a> }
            </div> }
        </div>
    )
}

export default PostComment
