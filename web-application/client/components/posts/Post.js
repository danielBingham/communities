import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { getPost, cleanupRequest } from '/state/posts'

import Linkify from 'react-linkify'

import Spinner from '/components/Spinner'
import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'

import LinkPreview from '/components/links/view/LinkPreview'
import PostDotsMenu from '/components/posts/widgets/PostDotsMenu'
import PostReactions from '/components/posts/widgets/PostReactions'
import PostComments from '/components/posts/comments/PostComments'
import PostImage from '/components/posts/PostImage'

import './Post.css'

const Post = function({ id, expanded }) {

    const [showMore, setShowMore] = useState(false) 

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if( requestId in state.posts.requests) {
            return state.posts.requests[requestId]
        } else {
            return null
        }
    })

    const post = useSelector(function(state) {
        return state.posts.dictionary[id]
    })

    const user = useSelector(function(state) {
        if ( post?.userId ) {
            return state.users.dictionary[post.userId]
        } else {
            return null
        }
    })

    const dispatch = useDispatch()
    const navigate = useNavigate()

    useEffect(function() {
        if ( ! post ) {
            setRequestId(dispatch(getPost(id)))
        }
        if ( expanded ) {
            setShowMore(true)
        }
    }, [ id ])

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])

    if ( (request && request !== null && request.state == 'failed' && ( ! post || ! user ))) {
        return (
            <div id={id} className="post">
                <div className='error 404'>
                    <h1>404 Error</h1>
                    That post does not seem to exist.
                </div>
            </div>
        )
    }

    if ( request && request.state == 'pending' ) {
        return ( <Spinner /> )
    }

    if ( ! post ) {
        return null
    }

    return (
        <div id={post.id} className="post">
            <div className="post__header"> 
                <div className="post__details">
                    <UserTag id={post.userId} /> posted <a href={`/${user.username}/${id}`}><DateTag timestamp={post.createdDate} /></a>
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
