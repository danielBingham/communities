/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import logger from '/logger'

import { isLocalStorageAvailable } from '/lib/localStorage'

import { startPostCommentEdit } from '/state/PostComment'

import PostComment from '/components/posts/PostComment'
import PostCommentForm from '/components/posts/PostCommentForm'

import './PostComments.css'

const PostComments = function({ postId, expanded }) {
    const [showComments, setShowComments] = useState(false)

    const post = useSelector(function(state) {
        if ( postId in state.Post.dictionary ) {
            return state.Post.dictionary[postId]
        } else {
            return null
        }
    })

    const editing = useSelector(function(state) {
        return state.PostComment.editing
    })

    const dispatch = useDispatch()

    useEffect(function() {
        if ( expanded ) {
            setShowComments(true)
        }
    }, [])

    useEffect(function() {
        if ( isLocalStorageAvailable() ) {
            try { 
                if ( post !== null ) {
                    for(const commentId of post.comments) {
                        const editDraft = localStorage.getItem(`commentDraft.${postId}.${commentId}`)
                        if ( editDraft && ! (commentId in editing)) {
                            dispatch(startPostCommentEdit(commentId))
                            setShowComments(true)
                        }
                    }

                    const draft = localStorage.getItem(`commentDraft.${postId}`)
                    if ( draft ) {
                        setShowComments(true)
                    }
                }
            } catch (error) {
                logger.error(error)
            }
        }
    }, [ postId, post ])

    if ( ! showComments && post && post.comments.length > 0 ) {
        return (
            <div className="post-comments">
                <div className="show-comments">
                    <a href="" onClick={(e) => { e.preventDefault(); setShowComments(true)}}>Show { post.comments.length } comments.</a>
                </div>
            </div>
        )
    }

    let commentViews = []
    if ( post ) {
        for (const commentId of post.comments ) {
            let draftEdit = null
            if ( isLocalStorageAvailable() ) {
                try { 
                    draftEdit = localStorage.getItem(`commentDraft.${postId}.${commentId}`)
                } catch (error) {
                    logger.error(error)
                }
            }
            if ( draftEdit || (commentId in editing) ) {
                commentViews.push(<PostCommentForm key={commentId} postId={postId} commentId={commentId} groupId={ post.groupId } setShowComments={setShowComments} />)
            } else {
                commentViews.push(<PostComment key={commentId} postId={postId} id={commentId} />)
            }
        }
    }

    return (
        <div className="post-comments">
            { commentViews }
            { showComments && post.comments.length > 0 && <div className="show-comments">
                <a href="" onClick={(e) => { e.preventDefault(); setShowComments(false)}}>Hide { post.comments.length } comments.</a>
            </div> }
            <PostCommentForm postId={postId} groupId={ post?.groupId } setShowComments={setShowComments} /> 
        </div>
    )
}

export default PostComments
