import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'

import { UsersIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/solid'

import { useFeature } from '/lib/hooks/feature'
import { usePostDraft } from '/lib/hooks/usePostDraft'
import { usePost } from '/lib/hooks/Post'
import { useUser } from '/lib/hooks/User'
import { useGroup } from '/lib/hooks/Group'
import { useSiteModeration } from '/lib/hooks/SiteModeration'
import { useGroupModeration } from '/lib/hooks/GroupModeration'


import Spinner from '/components/Spinner'
import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'
import UserProfileImage from '/components/users/UserProfileImage'

import LinkPreview from '/components/links/view/LinkPreview'
import GroupTag from '/components/groups/view/GroupTag'
import PostForm from '/components/posts/PostForm'

import PostDotsMenu from './PostDotsMenu'
import PostModeration from './PostModeration'
import PostImage from './PostImage'
import PostReactions from './PostReactions'
import PostComments from './PostComments'

import TextWithMentions from '/components/posts/TextWithMentions'

import './Post.css'

const Post = function({ id, expanded, showLoading, shared }) {
    const [showMore, setShowMore] = useState(expanded) 

    const hasAdminModeration = useFeature('62-admin-moderation-controls')

    const [post, request] = usePost(id)
    const [user, userRequest] = useUser(post?.userId)
    const [group, groupRequest] = useGroup(post?.groupId) 
    const [groupModeration, groupModerationRequest] = useGroupModeration(post?.groupModerationId)
    const [siteModeration, siteModerationRequest] = useSiteModeration(post?.siteModerationId)

    const [draft, setDraft] = usePostDraft(id)

    if ( (request !== null && request.state == 'failed' && ( ! post || ! user ))) {
        return (
            <div id={id} className="post">
                <div className="post__error 404">
                    <h1>404 Error</h1>
                    That post does not seem to exist.
                </div>
            </div>
        )
    }

    // ------------------------------------------------------------------------
    // Show a spinner if any of the components are still loading and
    // `showLoading === true`
    // ------------------------------------------------------------------------
    
    if ( showLoading 
        && (
            (request && request.state == 'pending' ) 
            || (userRequest && userRequest.state === 'pending') 
            || (groupRequest && groupRequest.state === 'pending')
            || (groupModerationRequest && groupModerationRequest.state === 'pending')
            || (siteModerationRequest && siteModerationRequest.state === 'pending')
        ) ) 
    {
        return ( <div id={id} className={`post ${ shared ? 'shared' : ''}`}><div className="post__loading"><Spinner /></div></div> )
    }

    // ------------------------------------------------------------------------
    // Make sure we have all the components before we show the post.
    // ------------------------------------------------------------------------
   
    if ( ! post 
        || (post?.userId && ! user) 
        || (post?.groupId && ! group)
        || (post?.siteModerationId && ! siteModeration)
        || (post?.groupModerationId && ! groupModeration)) 
    {
        return null
    }

    // ------------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------------

    let postLink = `/${user.username}/${id}`
    if ( post.groupId && group ) {
        postLink = `/group/${group.slug}/${id}`
    }

    let postVisibility = (<span className="post__post-visibility"><UsersIcon /> <span className="text">Friends</span></span>)
    if ( group !== null && group !== undefined ) {
        if ( post.visibility === 'private' ) {
            postVisibility = (
                <span className="post__post-visibility">
                    <span className="post__post-visibility"> <UserGroupIcon /> <span className="text">Group</span></span>
                </span>
            )
        } else if ( post.visibility === 'public' ) {
            postVisibility = (
                <span className="post__post-visibility">
                    <span className="post__post-visibility"> <GlobeAltIcon /> <span className="text">Public</span></span>
                </span>
            )
        }
    }

    if (post.visibility == 'public' ) {
        postVisibility = (<span className="post__post-visibility"> <GlobeAltIcon /> <span className="text">Public</span></span>)
    }

    if ( (siteModeration !== null && siteModeration.status === 'rejected') 
        || (groupModeration !== null && groupModeration.status === 'rejected') ) 
    {
        return (
            <div id={post.id} className={`post ${shared ? 'shared' : '' }`}>
                <div className="post__header"> 
                    <div className="post__poster-image"><UserProfileImage userId={post.userId} /></div>
                    <div className="post__details">
                        <div><UserTag id={post.userId} hideProfile={true} /> { post.groupId &&<span>posted in <GroupTag id={post.groupId} hideProfile={true} /></span>}</div> 
                        <div><span className="post__visibility">{ postVisibility }</span> &bull; <Link to={postLink}><DateTag timestamp={post.createdDate} /></Link> </div>
                    </div>
                    <div className="post__siteModeration">
                        <PostModeration postId={post.id} />
                    </div>
                    <div></div>
                </div>
                <div className="post__content">
                    <div className="post__moderated">
                        { siteModeration && siteModeration.status === 'rejected' && (siteModeration.reason !== null && siteModeration.reason.length > 0) && 
                            <p>Post removed by a Site moderator with explanation: { siteModeration.reason }</p> 
                        }
                        { siteModeration && siteModeration.status === 'rejected' && (siteModeration.reason === null || siteModeration.reason.length <= 0) &&
                            <p>Post removed by a Site moderator.</p>
                        }
                        { groupModeration && groupModeration.status === 'rejected' && groupModeration.reason !== null && groupModeration.reason.length > 0 && 
                            <p>Post removed by a Group moderator with explanation: { groupModeration.reason }</p> 
                        }
                        { groupModeration && groupModeration.status === 'rejected' && (groupModeration.reason === null || groupModeration.reason.length <= 0) &&
                            <p>Post removed by a Group moderator.</p>
                        }
                    </div>
                </div>
            </div>
        )
    } 

    return (
        <div id={post.id} className={`post ${ shared ? 'shared' : ''}`}>
            <div className="post__header"> 
                <div className="post__poster-image"><div><UserProfileImage userId={post.userId} /></div></div>
                <div className="post__details">
                    <div><UserTag id={post.userId} hideProfile={true} /> { post.groupId &&<span>posted in <GroupTag id={post.groupId} hideProfile={true} /></span>}</div> 
                    <div><span className="post__visibility">{ postVisibility }</span> &bull; <Link to={postLink}><DateTag timestamp={post.createdDate} /></Link> </div>
                </div>
                <div className="post__moderation">
                    { hasAdminModeration && ! shared && <PostModeration postId={post.id} /> }
                </div>
                <div className="post__controls">
                    { ! shared && <PostDotsMenu postId={post.id} /> }
                </div>
            </div>
            { post.content && post.content.length > 0 && (post.content.length <= 1000 || showMore) && <div className="post__content">
                <TextWithMentions text={ post.content } />
                {/*{ post.content.length >= 1000 && showMore && <div className="show-more">
                    <a href="" onClick={(e) => { e.preventDefault(); setShowMore(false) }}>Hide More.</a></div> */}
            </div> } 
            { post.content && post.content.length > 0 && post.content.length > 1000 && ! showMore && <div className="post__content">
                { post.content.substring(0,1000) }...
                <div className="post__show-more"><a href="" onClick={(e) => { e.preventDefault(); setShowMore(true) }}>Show More.</a></div>
            </div> }
            <PostImage id={id} />
            { post.linkPreviewId && <LinkPreview id={post.linkPreviewId} /> }
            { post.sharedPostId && <Post id={post.sharedPostId} shared={true} showLoading={true} /> }
            { ! shared && <PostReactions postId={id} /> }
            { ! shared && <PostComments postId={id} expanded={expanded} /> }
        </div>
    )
}

export default Post
