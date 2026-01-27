import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { useFeature } from '/lib/hooks/feature'
import { usePost } from '/lib/hooks/Post'
import { usePostComment } from '/lib/hooks/PostComment'
import { useSiteModeration } from '/lib/hooks/SiteModeration'
import { useGroupModeration } from '/lib/hooks/GroupModeration'
import { usePostLink } from '/lib/hooks/Post'

import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'

import PostCommentDotsMenu from './PostCommentDotsMenu'
import PostCommentModeration from './PostCommentModeration'

import TextWithMentions from '/components/posts/TextWithMentions'

import './PostComment.css'

const PostComment = function({ postId, id }) {
    const [highlight, setHighlight] = useState(false)

    const [post, postRequest] = usePost(postId)
    const [comment, request] = usePostComment(postId, id)
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
            <div id={`comment-${comment.id}`} key={comment.id} className={`post-comment ${ highlight ? 'highlight' : ''}`}>
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

    return (
        <div id={`comment-${comment.id}`} key={comment.id} className={`post-comment ${ highlight ? 'highlight' : ''}`}>
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
        </div>
    )
}

export default PostComment
