import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import { getPost } from '/state/posts'

import Linkify from 'react-linkify'

import Spinner from '/components/Spinner'
import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'

import LinkPreview from '/components/links/view/LinkPreview'
import PostDotsMenu from '/components/posts/widgets/PostDotsMenu'
import PostReactions from '/components/posts/widgets/PostReactions'
import PostComments from '/components/posts/comments/PostComments'
import PostImage from '/components/posts/PostImage'
import GroupTag from '/components/groups/view/GroupTag'
import PostForm from '/components/posts/form/PostForm'

import './Post.css'

const Post = function({ id, expanded, showLoading }) {
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


    return (
        <div id={post.id} className="post">
            <div className="post__header"> 
                <div className="post__details">
                    <UserTag id={post.userId} /> posted <Link to={postLink}><DateTag timestamp={post.createdDate} /></Link> { post.groupId &&<span>in <GroupTag id={post.groupId} /></span>}
                </div>
                <div className="post__controls">
                    <PostDotsMenu postId={post.id} />
                </div>
            </div>
            { post.content && post.content.length > 0 && (post.content.length <= 1000 || showMore) && <div className="post__content">
                <Linkify>{ post.content }</Linkify>
                {/*{ post.content.length >= 1000 && showMore && <div className="show-more">
                    <a href="" onClick={(e) => { e.preventDefault(); setShowMore(false) }}>Hide More.</a></div> */}
            </div> } 
            { post.content && post.content.length > 0 && post.content.length > 1000 && ! showMore && <div className="post__content">
                { post.content.substring(0,1000) }...
                <div className="post__show-more"><a href="" onClick={(e) => { e.preventDefault(); setShowMore(true) }}>Show More.</a></div>
            </div> }
            <PostImage id={id} />
            { post.linkPreviewId && <LinkPreview id={post.linkPreviewId} /> }
            <PostReactions postId={id} />
            <PostComments postId={id} expanded={expanded} />
        </div>
    )
}

export default Post
