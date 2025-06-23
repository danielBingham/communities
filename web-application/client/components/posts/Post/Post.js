import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'

import { UsersIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/solid'

import { usePostDraft } from '/lib/hooks/usePostDraft'
import { useFeature } from '/lib/hooks/feature'
import { usePost } from '/lib/hooks/Post'
import { useUser } from '/lib/hooks/User'

import Linkify from 'react-linkify'

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

    const [post, request] = usePost(id)
    const [user, userRequest] = useUser(post?.userId)
    const group = useSelector((state) => post?.groupId && post.groupId in state.Group.dictionary ? state.Group.dictionary[post.groupId] : null)

    const hasAdminModeration = useFeature('62-admin-moderation-controls')
    const moderation = useSelector((state) => hasAdminModeration && id && id in state.SiteModeration.byPostId ? state.SiteModeration.byPostId[id] : null)

    const [draft, setDraft] = usePostDraft(id)
    if ( draft !== null) {
        return <PostForm postId={id} groupId={ post && post.groupId} />
    }

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

    if ( showLoading && (request && request.state == 'pending' )) {
        return ( <div id={id} className="post"><Spinner /></div> )
    }

    if ( ! post ) {
        return null
    }

    let postLink = `/${user.username}/${id}`
    if ( post.groupId && group ) {
        postLink = `/group/${group.slug}/${id}`
    }

    let postVisibility = (<span className="post__post-visibility"><UsersIcon /> <span className="text">Friends</span></span>)
    if ( group !== null ) {
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

    if ( moderation !== null && moderation.status === 'rejected' ) {
        return (
            <div id={post.id} className={`post ${shared ? 'shared' : '' }`}>
                <div className="post__header"> 
                    <div className="post__poster-image"><UserProfileImage userId={post.userId} /></div>
                    <div className="post__details">
                        <div><UserTag id={post.userId} hideProfile={true} /> { post.groupId &&<span>posted in <GroupTag id={post.groupId} hideProfile={true} /></span>}</div> 
                        <div><span className="post__visibility">{ postVisibility }</span> &bull; <Link to={postLink}><DateTag timestamp={post.createdDate} /></Link> </div>
                    </div>
                    <div className="post__moderation">
                        <PostModeration postId={post.id} />
                    </div>
                    <div className="post__controls">
                    </div>
                </div>
                <div className="post__content">
                    <div className="post__moderated">
                        <p>Post removed by moderator.</p>

                        { moderation.reason !== null && moderation.reason.length > 0 && 
                            <p>{ moderation.reason }</p> 
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
                <Linkify><TextWithMentions text={ post.content } /></Linkify>
                {/*{ post.content.length >= 1000 && showMore && <div className="show-more">
                    <a href="" onClick={(e) => { e.preventDefault(); setShowMore(false) }}>Hide More.</a></div> */}
            </div> } 
            { post.content && post.content.length > 0 && post.content.length > 1000 && ! showMore && <div className="post__content">
                { post.content.substring(0,1000) }...
                <div className="post__show-more"><a href="" onClick={(e) => { e.preventDefault(); setShowMore(true) }}>Show More.</a></div>
            </div> }
            <PostImage id={id} />
            { post.linkPreviewId && <LinkPreview id={post.linkPreviewId} /> }
            { post.sharedPostId && <Post id={post.sharedPostId} shared={true} /> }
            { ! shared && <PostReactions postId={id} /> }
            { ! shared && <PostComments postId={id} expanded={expanded} /> }
        </div>
    )
}

export default Post
