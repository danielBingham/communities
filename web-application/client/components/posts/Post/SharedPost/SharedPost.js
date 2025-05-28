import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'

import { UsersIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import { getPost } from '/state/posts'

import Linkify from 'react-linkify'

import Spinner from '/components/Spinner'
import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'
import UserProfileImage from '/components/users/UserProfileImage'

import LinkPreview from '/components/links/view/LinkPreview'
import { PostImage } from '/components/posts/Post'
import GroupTag from '/components/groups/view/GroupTag'
import PostForm from '/components/posts/PostForm'

import './SharedPost.css'

const SharedPost = function({ id, expanded, showLoading }) {
    const [showMore, setShowMore] = useState(expanded) 

    const [request, makeRequest] = useRequest()

    const post = useSelector((state) => id && id in state.posts.dictionary ? state.posts.dictionary[id] : null) 
    const user = useSelector((state) => post?.userId && post.userId in state.users.dictionary ? state.users.dictionary[post.userId] : null) 
    const group = useSelector((state) => post?.groupId && post.groupId in state.groups.dictionary ? state.groups.dictionary[post.groupId] : null)

    useEffect(function() {
        if ( ! post ) {
            makeRequest(getPost(id))
        }
    }, [ id, post ])

    const [draft, setDraft] = usePostDraft(id)
    if ( draft !== null) {
        return <PostForm postId={id} groupId={ post && post.groupId} />
    }

    if ( (request !== null && request.state == 'failed' && ( ! post || ! user ))) {
        return (
            <div id={id} className="shared-post">
                <div className="shared-post__error 404">
                    <h1>404 Error</h1>
                    That post does not seem to exist.
                </div>
            </div>
        )
    }

    if ( showLoading && (request && request.state == 'pending' )) {
        return ( <div id={id} className="shared-post"><Spinner /></div> )
    }

    if ( ! post ) {
        return null
    }

    let postLink = `/${user.username}/${id}`
    if ( post.groupId && group ) {
        postLink = `/group/${group.slug}/${id}`
    }

    let postVisibility = (<span className="shared-post__post-visibility"><UsersIcon /> <span className="text">Friends</span></span>)
    if ( group !== null ) {
        if ( post.visibility === 'private' ) {
            postVisibility = (
                <span className="shared-post__post-visibility">
                    <span className="shared-post__post-visibility"> <UserGroupIcon /> <span className="text">Group</span></span>
                </span>
            )
        } else if ( post.visibility === 'public' ) {
            postVisibility = (
                <span className="shared-post__post-visibility">
                    <span className="shared-post__post-visibility"> <GlobeAltIcon /> <span className="text">Public</span></span>
                </span>
            )
        }
    }

    if (post.visibility == 'public' ) {
        postVisibility = (<span className="shared-post__post-visibility"> <GlobeAltIcon /> <span className="text">Public</span></span>)
    }


    return (
        <div id={post.id} className="shared-post">
            <div className="shared-post__header"> 
                <div className="shared-post__poster-image"><UserProfileImage userId={post.userId} /></div>
                <div className="shared-post__details">
                    <div><UserTag id={post.userId} hideProfile={true} /> { post.groupId &&<span>posted in <GroupTag id={post.groupId} hideProfile={true} /></span>}</div> 
                    <div><span className="shared-post__visibility">{ postVisibility }</span> &bull; <Link to={postLink}><DateTag timestamp={post.createdDate} /></Link> </div>
                </div>
                <div className="shared-post__controls">
                </div>
            </div>
            { post.content && post.content.length > 0 && (post.content.length <= 1000 || showMore) && <div className="shared-post__content">
                <Linkify>{ post.content }</Linkify>
                {/*{ post.content.length >= 1000 && showMore && <div className="show-more">
                    <a href="" onClick={(e) => { e.preventDefault(); setShowMore(false) }}>Hide More.</a></div> */}
            </div> } 
            { post.content && post.content.length > 0 && post.content.length > 1000 && ! showMore && <div className="shared-post__content">
                { post.content.substring(0,1000) }...
                <div className="shared-post__show-more"><a href="" onClick={(e) => { e.preventDefault(); setShowMore(true) }}>Show More.</a></div>
            </div> }
            <PostImage id={id} />
            { post.linkPreviewId && <LinkPreview id={post.linkPreviewId} /> }
        </div>
    )
}

export default SharedPost 
